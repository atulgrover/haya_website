#!/usr/bin/env python3
"""
Sub-Step 1.2: PDF-to-Markdown Converter
Converts downloaded NCVET NSQF Curriculum PDFs (in data/pdfs/) into clean, human-readable Markdown files (in data/md/)
and updates pipeline_status = 'md_converted' in SQLite database.

Usage:
    python3 scripts/nsqf_pdf_to_md.py --limit=5
    python3 scripts/nsqf_pdf_to_md.py --qp=AMH/Q0103
"""

import sys
import os
import re
import sqlite3
import argparse
from pypdf import PdfReader
import pdfplumber

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PDF_DIR = os.path.join(BASE_DIR, 'data', 'pdfs')
MD_DIR = os.path.join(BASE_DIR, 'data', 'md')
DB_PATH = os.path.join(BASE_DIR, 'server', 'portal_database.db')

os.makedirs(MD_DIR, exist_ok=True)

def format_table_to_md(table):
    """
    Converts a pdfplumber extracted 2D table array into GFM Markdown table syntax.
    """
    if not table or not isinstance(table, list) or len(table) == 0:
        return ""
        
    cleaned_rows = []
    for row in table:
        if not row:
            continue
        cleaned_row = [str(cell or "").replace("\n", " ").strip() for cell in row]
        if any(cleaned_row):
            cleaned_rows.append(cleaned_row)
            
    if not cleaned_rows:
        return ""

    num_cols = max(len(r) for r in cleaned_rows)
    # Pad shorter rows
    for r in cleaned_rows:
        while len(r) < num_cols:
            r.append("")

    header_row = cleaned_rows[0]
    separator_row = [":---"] + [":---:"] * (num_cols - 1)

    md_table_lines = [
        "| " + " | ".join(header_row) + " |",
        "| " + " | ".join(separator_row) + " |"
    ]

    for row in cleaned_rows[1:]:
        md_table_lines.append("| " + " | ".join(row) + " |")

    return "\n".join(md_table_lines) + "\n\n"

def extract_pdf_to_markdown(pdf_path, qp_code, qp_name=""):
    """
    Parses a single PDF using pdfplumber for 100% accurate table and text extraction into Markdown.
    """
    clean_qp = qp_code.replace('/', '_')
    md_lines = []
    
    with pdfplumber.open(pdf_path) as pdf:
        num_pages = len(pdf.pages)
        md_lines.append(f"# Qualification Pack: {qp_name or qp_code}")
        md_lines.append(f"**QP Code**: `{qp_code}`  ")
        md_lines.append(f"**Total Document Pages**: {num_pages}  ")
        md_lines.append("---")
        md_lines.append("")

        for idx, page in enumerate(pdf.pages):
            md_lines.append(f"### Page {idx + 1}")
            md_lines.append("")

            # 1. Extract tables on page
            tables = page.extract_tables()
            if tables:
                for tbl in tables:
                    formatted_tbl = format_table_to_md(tbl)
                    if formatted_tbl:
                        md_lines.append(formatted_tbl)

            # 2. Extract regular text
            text = page.extract_text() or ""
            if text.strip():
                lines = [l.strip() for l in text.split("\n") if l.strip()]
                for line_str in lines:
                    if re.match(r'^(Module|NOS|Unit|Section|Table)', line_str, re.IGNORECASE):
                        md_lines.append(f"#### {line_str}")
                    elif re.match(r'^(PC\s*\d+\.\d+|\d+\.\d+|\d+\.)', line_str):
                        md_lines.append(f"- {line_str}")
                    else:
                        md_lines.append(line_str)
            md_lines.append("")

    md_content = "\n".join(md_lines)
    out_md_path = os.path.join(MD_DIR, f"{clean_qp}.md")
    
    with open(out_md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
        
    return out_md_path, len(md_content)

def main():
    parser = argparse.ArgumentParser(description="Convert NSQF PDFs to Markdown")
    parser.add_argument("--limit", type=int, default=5, help="Number of QPs to convert")
    parser.add_argument("--qp", type=str, default=None, help="Target QP Code")
    args = parser.parse_args()

    print("================================================================================")
    print("📝 [Sub-Step 1.2] AUTOMATED PDF-TO-MARKDOWN CONVERTER")
    print("================================================================================\n")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if args.qp:
        clean_target = args.qp.replace('/', '_')
        cursor.execute("SELECT id, qp_code, qp_name, markdown_path FROM nsqf_qps WHERE qp_code = ? OR REPLACE(qp_code, '/', '_') = ?", (args.qp, clean_target))
    else:
        cursor.execute("SELECT id, qp_code, qp_name, markdown_path FROM nsqf_qps ORDER BY id ASC LIMIT ?", (args.limit,))

    rows = cursor.fetchall()
    if not rows:
        print("❌ No Qualification Packs found matching target criteria.")
        conn.close()
        return

    print(f"Converting {len(rows)} Qualification Packs to Markdown...\n")

    converted_count = 0
    failed_count = 0

    for idx, (qp_id, qp_code, qp_name, existing_md) in enumerate(rows):
        clean_code = qp_code.replace('/', '_')
        pdf_file_path = os.path.join(PDF_DIR, f"{clean_code}.pdf")
        md_file_path = os.path.join(MD_DIR, f"{clean_code}.md")

        print(f"[{idx + 1}/{len(rows)}] 📌 QP: {qp_code} — \"{qp_name}\"")

        if not os.path.exists(pdf_file_path):
            print(f"        ⚠️ PDF file not found at: {pdf_file_path} ➔ Skipping")
            failed_count += 1
            print("--------------------------------------------------------------------------------")
            continue

        try:
            out_path, bytes_len = extract_pdf_to_markdown(pdf_file_path, qp_code, qp_name)
            print(f"        🎉 Converted to Markdown ({bytes_len / 1024:.1f} KB) ➔ Saved to data/md/{clean_code}.md")
            
            # Update SQLite database status
            cursor.execute("""
                UPDATE nsqf_qps 
                SET markdown_path = ?, pipeline_status = 'md_converted'
                WHERE id = ?
            """, (out_path, qp_id))
            conn.commit()
            converted_count += 1

        except Exception as e:
            print(f"        ❌ Error converting PDF: {str(e)}")
            failed_count += 1

        print("--------------------------------------------------------------------------------")

    conn.close()

    print("\n================================================================================")
    print("📊 SUB-STEP 1.2 SUMMARY:")
    print(f"   Total QPs Processed:  {len(rows)}")
    print(f"   Successfully Converted: {converted_count}")
    print(f"   Failed / Missing PDF:   {failed_count}")
    print(f"   Markdown Directory:     {MD_DIR}")
    print("================================================================================\n")

if __name__ == '__main__':
    main()
