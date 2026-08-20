#!/usr/bin/env python3
"""
Sub-Step 1.2: PDF-to-Markdown Converter  (v4 — Table PC extraction, pipe escaping, robust regex)
Converts downloaded NCVET NSQF Curriculum PDFs (in data/pdfs/) into clean,
human-readable Markdown files (in data/md/).

v4 improvements vs v3:
  1. Table PC Extraction & Pipe Escaping:
     - Escapes '|' in table cells to prevent broken GFM tables.
     - Inspects table rows for embedded PC markers (PC1. / 1.) and formats them as structured criteria.
  2. Pattern Modernization:
     - NOS_RE: supports leading labels ("NOS Code:", "Unit:", "- ") and version tags.
     - PC_RE: supports decimals (PC 1.1), alternative dividers (PC-1:, PC #1:), and bullet forms.
     - NUM_RE: supports decimals (1.1, 1.2) and parentheses.
  3. State Machine Hardening (in_pc_section):
     - Expanded PC_START_RE (covers "Elements & Outcomes", "PC Description", "Scope of the NOS").
     - Expanded PC_END_RE (covers "Technical Knowledge", "Organizational Context", "Core Skills", "Assessment Guidelines", "Acronyms").
  4. Continuation Line Joining:
     - Joins lines broken after conjunctions/prepositions ("and", "or", "to", "for", "with", "using", "of", "by", "including") even with uppercase acronyms.
     - Guards unit abbreviations (pH, dB, kHz, mm, kg) from false joins.
  5. DB Connection Reuse:
     - Uses a single persistent psycopg2 connection session across batch runs.
     - Normalized QP code matching in database updates.

Usage:
    python3 scripts/nsqf_pdf_to_md.py --qp=NIE/ELE/Q0803
    python3 scripts/nsqf_pdf_to_md.py --limit=10
    python3 scripts/nsqf_pdf_to_md.py --all              # reconvert ALL 2001 QPs
    python3 scripts/nsqf_pdf_to_md.py --all --resume     # resume from last checkpoint
"""

import sys
import os
import re
import json
import argparse
import pdfplumber

# ── Optional DB tracking via local PostgreSQL ──────────────────────────────────
try:
    import psycopg2
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
    _PG_URL = os.getenv('LOCAL_DATABASE_URL') or os.getenv('DATABASE_URL')
    _HAS_PG = bool(_PG_URL) and 'neon.tech' not in (_PG_URL or '')
except ImportError:
    _HAS_PG = False
    _PG_URL = None

BASE_DIR        = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PDF_DIR         = os.path.join(BASE_DIR, 'data', 'pdfs')
MD_DIR          = os.path.join(BASE_DIR, 'data', 'md')
CHECKPOINT_PATH = os.path.join(BASE_DIR, 'data', '.pdf2md_checkpoint.json')

os.makedirs(MD_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────
# Patterns
# ─────────────────────────────────────────────────────────────

# Matches NSQF NOS/QP codes with optional prefixes ("NOS Code:", "Unit:", "- ")
NOS_RE = re.compile(
    r'^(?:(?:NOS|Unit|Standard|Module)\s*(?:Code)?[:\s\-]*)?[-*]?\s*'
    r'([A-Z&]{2,10}(?:/[A-Z0-9&]{2,10}){0,2}/[NQ]\d{3,4}(?:[_\-vV\d.]+)?)\b',
    re.IGNORECASE
)

# Matches explicit PC markers: "PC1.", "PC 1:", "PC 1.1", "PC-1:", "PC #1", "- PC1."
PC_RE = re.compile(
    r'^[-*|]?\s*PC\s*#?\s*(\d+(?:\.\d+)?)[.:\s-]+(.+)',
    re.IGNORECASE
)

# Matches numbered criteria: "1.", "1.1", "1)", "(1)"
NUM_RE = re.compile(
    r'^[-*|]?\s*\(?(\d+(?:\.\d+)?)\)?[.:\s-]+(.+)'
)

# Matches Knowledge and Skills list items: "KU1.", "GS1.", "KU 1.1"
KU_GS_RE = re.compile(
    r'^[-*|]?\s*(KU\s*\d+(?:\.\d+)?|GS\s*\d+(?:\.\d+)?)[.:\s-]+(.+)',
    re.IGNORECASE
)

# Expanded PC start triggers
PC_START_RE = re.compile(
    r'^(?:Elements\s*(?:and|&)\s*Performance|Performance\s*Criteria|'
    r'Elements\s*(?:and|&)\s*Outcomes|To\s+be\s+competent|'
    r'PC\s*Description|Scope\s*of\s*(?:the\s*)?NOS|Assessment\s*Criteria\s*for\s*Outcomes)',
    re.IGNORECASE
)

# Expanded PC section end triggers
PC_END_RE = re.compile(
    r'^(?:Knowledge\s*(?:and|&)\s*Understanding|Technical\s*Knowledge|'
    r'Organizational\s*Context|Generic\s*Skills|Core\s*Skills|'
    r'Assessment\s*Criteria$|Assessment\s*Guidelines|'
    r'National\s*Occupational\s*Standards\s*\(NOS\)\s*Parameters|Acronyms|Glossary)',
    re.IGNORECASE
)

# Tightened structural headings
SECTION_RE = re.compile(
    r'^(?:Module\s+\d|NOS\s+\d|Unit\s+\d|Section\s+\d|Element\s+\d|'
    r'Performance\s+Criteria\s*$|Elements\s*(?:and|&)\s*Performance|'
    r'Knowledge\s*(?:and|&)\s*Understanding|Generic\s*Skills|Core\s*Skills)',
    re.IGNORECASE
)

ENDS_SENT  = re.compile(r'[.;:]\s*$')
WHITESPACE = re.compile(r'\s+')

# Conjunctions/prepositions that signal mid-sentence wrapping
ENDS_CONTINUATION_WORD = re.compile(
    r'\b(?:and|or|the|in|to|for|with|using|of|by|as|including|such\s+as|between|into|from|at|on)\s*$',
    re.IGNORECASE
)

# Units/symbols that should not be merged as regular lowercase continuations
LOWER_BULLET_GUARDS = re.compile(r'^(?:pH|dB|kHz|MHz|GHz|mm|cm|kg|mg|ml|e\.g\.|i\.e\.)\b')


# ─────────────────────────────────────────────────────────────
# Table → Markdown (with pipe escaping & cell cleaning)
# ─────────────────────────────────────────────────────────────
def format_table_to_md(table):
    """Convert a pdfplumber 2-D table array to GFM Markdown table syntax."""
    if not table:
        return ""

    cleaned_rows = []
    for row in table:
        if not row:
            continue
        # Escape literal pipes inside cell values to preserve valid Markdown table syntax
        cleaned = [
            WHITESPACE.sub(' ', str(cell or '')).replace('|', '\\|').strip()
            for cell in row
        ]
        if any(cleaned):
            cleaned_rows.append(cleaned)

    if not cleaned_rows:
        return ""

    num_cols = max(len(r) for r in cleaned_rows)
    for r in cleaned_rows:
        while len(r) < num_cols:
            r.append('')

    sep   = ['---'] + [':---:'] * (num_cols - 1)
    lines = [
        '| ' + ' | '.join(cleaned_rows[0]) + ' |',
        '| ' + ' | '.join(sep) + ' |',
    ]
    for row in cleaned_rows[1:]:
        lines.append('| ' + ' | '.join(row) + ' |')

    return '\n'.join(lines) + '\n\n'


# ─────────────────────────────────────────────────────────────
# Table text → dedup set & embedded PC extractor
# ─────────────────────────────────────────────────────────────
def build_table_text_set(tables):
    """
    Collect cell strings from all tables on a page for plain-text deduping.
    """
    seen = set()
    for table in tables:
        for row in table:
            if not row:
                continue
            for cell in row:
                if not cell:
                    continue
                norm = WHITESPACE.sub(' ', str(cell)).strip()
                if len(norm) >= 8:
                    seen.add(norm)
                    seen.add(norm[:80])
    return seen


def extract_table_pcs(tables):
    """
    Extract any explicit PC items found inside table cells.
    Returns list of formatted "- PCn. description" strings.
    """
    extracted_pcs = []
    for table in tables:
        for row in table:
            if not row:
                continue
            for cell in row:
                if not cell:
                    continue
                cell_text = str(cell).strip()
                lines = [l.strip() for l in cell_text.split('\n') if l.strip()]
                for line in lines:
                    m_pc = PC_RE.match(line)
                    if m_pc:
                        extracted_pcs.append(f"PC{m_pc.group(1)}. {m_pc.group(2).strip()}")
    return extracted_pcs


def line_in_table(line, table_set):
    """Return True if line is substantially covered by table content."""
    norm = WHITESPACE.sub(' ', line).strip()
    return norm in table_set or norm[:80] in table_set


# ─────────────────────────────────────────────────────────────
# Multi-column text extraction
# ─────────────────────────────────────────────────────────────
def extract_page_text(page):
    """
    Extract text using spatial layout awareness.
    """
    try:
        return page.extract_text(layout=True, x_tolerance=3, y_tolerance=3) or ''
    except TypeError:
        return page.extract_text(x_tolerance=3, y_tolerance=3) or ''


# ─────────────────────────────────────────────────────────────
# Continuation-line joining
# ─────────────────────────────────────────────────────────────
def join_continuations(raw_lines):
    """
    Merge lines that are right-column continuations of a truncated left-column line.
    """
    if not raw_lines:
        return []

    result = [raw_lines[0]]

    for line in raw_lines[1:]:
        prev = result[-1]

        # Never merge structural elements
        if (line.startswith('|') or prev.startswith('|')
                or PC_RE.match(line) or NOS_RE.match(line)
                or NUM_RE.match(line) or KU_GS_RE.match(line)
                or SECTION_RE.match(line) or line.startswith('#')
                or PC_RE.match(prev) or NOS_RE.match(prev)):
            result.append(line)
            continue

        is_lower_start = bool(line) and line[0].islower() and not LOWER_BULLET_GUARDS.match(line)
        is_hanging_word = bool(prev) and bool(ENDS_CONTINUATION_WORD.search(prev))

        # Widened heuristic: also merge when previous line is short and
        # next line starts lowercase (likely a broken mid-sentence wrap)
        is_short_prev_continuation = (
            bool(line)
            and is_lower_start
            and not ENDS_SENT.search(prev)
            and len(prev) < 60
        )

        is_continuation = (
            bool(line)
            and (is_lower_start or is_hanging_word or is_short_prev_continuation)
            and not ENDS_SENT.search(prev)
            and len(prev) < 95
        )

        if is_continuation:
            result[-1] = prev + ' ' + line
        else:
            result.append(line)

    return result


# ─────────────────────────────────────────────────────────────
# Classify and format a single text line
# ─────────────────────────────────────────────────────────────
def classify_line(line, in_pc_section=False):
    """
    Return (markdown_prefix, line_text, next_in_pc_section).
    """
    m_nos = NOS_RE.match(line)
    if m_nos:
        nos_code = m_nos.group(1).upper()
        remainder = line[m_nos.end():].lstrip(': -')
        heading = f"{nos_code}: {remainder}" if remainder else nos_code
        return '####', heading, False

    if PC_END_RE.match(line):
        return '####', line, False

    if PC_START_RE.match(line):
        return '####', line, True

    if SECTION_RE.match(line) and len(line) < 120:
        return '####', line, in_pc_section

    # Explicit PC line (e.g. PC1., PC 1.1, PC-1:, PC #1:)
    m_pc = PC_RE.match(line)
    if m_pc:
        return '-', f'PC{m_pc.group(1)}. {m_pc.group(2).strip()}', in_pc_section

    # Numbered criteria inside Elements & Performance Criteria section
    if in_pc_section:
        m_num = NUM_RE.match(line)
        if m_num:
            return '-', f'PC{m_num.group(1)}. {m_num.group(2).strip()}', in_pc_section

    # Knowledge & Skills list items
    m_kugs = KU_GS_RE.match(line)
    if m_kugs:
        code_tag = m_kugs.group(1).upper().replace(' ', '')
        return '-', f'{code_tag}. {m_kugs.group(2).strip()}', in_pc_section

    return '', line, in_pc_section


# ─────────────────────────────────────────────────────────────
# bbox helper
# ─────────────────────────────────────────────────────────────
def _bbox_contains(outer_bbox, obj):
    """Return True if obj's bounding box lies fully inside outer_bbox."""
    ox0, oy0, ox1, oy1 = outer_bbox
    x0 = obj.get('x0', obj.get('x', 0))
    y0 = obj.get('top', obj.get('y0', 0))
    x1 = obj.get('x1', x0)
    y1 = obj.get('bottom', obj.get('y1', y0))
    return x0 >= ox0 and y0 >= oy0 and x1 <= ox1 and y1 <= oy1


# ─────────────────────────────────────────────────────────────
# Main per-PDF extractor
# ─────────────────────────────────────────────────────────────
def extract_pdf_to_markdown(pdf_path, qp_code, qp_name=''):
    """
    Parse a single PDF into clean Markdown.
    """
    clean_qp = qp_code.replace('/', '_')
    md_lines = []
    pc_count = 0
    in_pc_section = False
    seen_pc_signatures = set()

    with pdfplumber.open(pdf_path) as pdf:
        num_pages = len(pdf.pages)
        md_lines.append(f'# Qualification Pack: {qp_name or qp_code}')
        md_lines.append(f'**QP Code**: `{qp_code}`  ')
        md_lines.append(f'**Total Document Pages**: {num_pages}  ')
        md_lines.append('---')
        md_lines.append('')

        for idx, page in enumerate(pdf.pages):
            page_md = [f'### Page {idx + 1}', '']

            # 1. Tables
            found_tables   = page.find_tables()
            table_bboxes   = [t.bbox for t in found_tables]
            raw_tables     = [t.extract() for t in found_tables]
            table_text_set = build_table_text_set(raw_tables)
            table_pcs      = extract_table_pcs(raw_tables)

            for raw_tbl in raw_tables:
                fmt = format_table_to_md(raw_tbl)
                if fmt:
                    page_md.append(fmt)

            # Record any PCs directly extracted from table cells
            for t_pc in table_pcs:
                sig = t_pc[:60].lower()
                if sig not in seen_pc_signatures:
                    seen_pc_signatures.add(sig)
                    pc_count += 1

            # 2. Text — prefer non-table regions to avoid double-extraction
            if table_bboxes:
                try:
                    non_table_page = page.filter(
                        lambda obj: not any(
                            _bbox_contains(tb, obj) for tb in table_bboxes
                        )
                    )
                    text = extract_page_text(non_table_page)
                except Exception:
                    text = extract_page_text(page)
            else:
                text = extract_page_text(page)

            # 3. Parse + join + classify
            raw_lines = [l.strip() for l in text.split('\n') if l.strip()]
            raw_lines = join_continuations(raw_lines)

            for line in raw_lines:
                if line_in_table(line, table_text_set):
                    continue  # already rendered in a table

                prefix, text_out, in_pc_section = classify_line(line, in_pc_section)
                if prefix == '####':
                    page_md.append(f'#### {text_out}')
                elif prefix == '-':
                    page_md.append(f'- {text_out}')
                    if text_out.startswith('PC'):
                        sig = text_out[:60].lower()
                        if sig not in seen_pc_signatures:
                            seen_pc_signatures.add(sig)
                            pc_count += 1
                else:
                    page_md.append(text_out)

            page_md.append('')
            md_lines.extend(page_md)

    md_content  = '\n'.join(md_lines)
    out_md_path = os.path.join(MD_DIR, f'{clean_qp}.md')

    with open(out_md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

    return out_md_path, len(md_content), pc_count


# ─────────────────────────────────────────────────────────────
# Checkpoint helpers
# ─────────────────────────────────────────────────────────────
def load_checkpoint():
    try:
        if os.path.exists(CHECKPOINT_PATH):
            return json.load(open(CHECKPOINT_PATH))
    except Exception:
        pass
    return None


def save_checkpoint(qp_code, index):
    with open(CHECKPOINT_PATH, 'w') as f:
        json.dump({'qp_code': qp_code, 'index': index}, f)


def clear_checkpoint():
    try:
        os.unlink(CHECKPOINT_PATH)
    except Exception:
        pass


# ─────────────────────────────────────────────────────────────
# DB helpers
# ─────────────────────────────────────────────────────────────
def get_db_connection():
    if not _HAS_PG:
        return None
    try:
        return psycopg2.connect(_PG_URL)
    except Exception as e:
        print(f'  [DB] PostgreSQL connection note: {e} (operating in disk-first mode)')
        return None


def _get_qp_list(args, conn=None):
    """
    Build list of (qp_code, qp_name) tuples to process.
    """
    if args.qp:
        clean = args.qp.replace('/', '_')
        return [(args.qp, clean)]

    if conn:
        try:
            cur = conn.cursor()
            if args.all:
                cur.execute('SELECT qp_code, qp_name FROM nsqf_qps ORDER BY id ASC')
            else:
                cur.execute('SELECT qp_code, qp_name FROM nsqf_qps ORDER BY id ASC LIMIT %s',
                            (args.limit,))
            rows = cur.fetchall()
            cur.close()
            if rows:
                print(f'  [DB] Loaded {len(rows)} QP(s) from local PostgreSQL.')
                return rows
        except Exception as e:
            print(f'  [DB] Query error ({e}) — falling back to PDF directory scan.')

    # Fallback: scan PDF_DIR
    pdfs = sorted(f for f in os.listdir(PDF_DIR) if f.endswith('.pdf'))
    if not args.all:
        pdfs = pdfs[:args.limit]
    return [(p.replace('.pdf', '').replace('_', '/', 2), p.replace('.pdf', '')) for p in pdfs]


def _mark_converted(conn, qp_code, md_path, pc_count):
    """Update pipeline_status in local PostgreSQL using persistent connection."""
    if not conn:
        return
    try:
        cur = conn.cursor()
        status = 'image_pdf_no_text' if pc_count == 0 else 'md_converted'
        cur.execute(
            """UPDATE nsqf_qps 
               SET markdown_path = %s, pipeline_status = %s 
               WHERE qp_code = %s OR REPLACE(qp_code, '/', '_') = %s""",
            (md_path, status, qp_code, qp_code.replace('/', '_'))
        )
        conn.commit()
        cur.close()
    except Exception:
        pass


# ─────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description='Convert NSQF PDFs to Markdown (v4 — Table PC extraction, pipe escaping, robust regex)'
    )
    parser.add_argument('--limit',  type=int, default=5,
                        help='Number of QPs to convert (default 5)')
    parser.add_argument('--qp',     type=str, default=None,
                        help='Target QP Code, e.g. NIE/ELE/Q0803')
    parser.add_argument('--all',    action='store_true',
                        help='Reconvert ALL QPs')
    parser.add_argument('--resume', action='store_true',
                        help='Resume from last checkpoint (use with --all)')
    args = parser.parse_args()

    db_conn = get_db_connection()

    print('================================================================================')
    print('📝 [Sub-Step 1.2] PDF-to-MARKDOWN CONVERTER  (v4 — Robust Table & Text Extraction)')
    print(f'   DB: {"local PostgreSQL (" + _PG_URL.split("@")[-1] + ")" if db_conn else "Disk-first mode"}')
    print('================================================================================\n')

    qp_list = _get_qp_list(args, db_conn)
    if not qp_list:
        print('❌  No QPs found. Check PDF_DIR or DB.')
        if db_conn:
            db_conn.close()
        return

    # Resume: skip already-completed QPs
    start_idx = 0
    if args.resume and not args.qp:
        cp = load_checkpoint()
        if cp:
            start_idx = cp.get('index', 0) + 1
            print(f'⏩  Resuming from index {start_idx} (after {cp["qp_code"]}).\n')

    total      = len(qp_list)
    to_process = qp_list[start_idx:]
    print(f'Converting {len(to_process)} of {total} Qualification Pack(s)…\n')

    converted_count = 0
    failed_count    = 0
    zero_pc_count   = 0

    try:
        for i, (qp_code, qp_name) in enumerate(to_process):
            abs_idx       = start_idx + i
            clean_code    = qp_code.replace('/', '_')
            pdf_file_path = os.path.join(PDF_DIR, f'{clean_code}.pdf')

            if not os.path.exists(pdf_file_path):
                print(f'[{abs_idx + 1}/{total}] ⚠️  PDF not found: {clean_code}.pdf → Skipping')
                failed_count += 1
                save_checkpoint(qp_code, abs_idx)
                continue

            try:
                out_path, byte_len, pc_count = extract_pdf_to_markdown(
                    pdf_file_path, qp_code, qp_name
                )
                if pc_count == 0:
                    zero_pc_count += 1
                    tag = '⚠️  0 PCs (image PDF / no criteria)'
                else:
                    tag = f'✅  {pc_count} PCs'

                print(f'[{abs_idx + 1}/{total}] {tag}  {byte_len / 1024:.1f} KB → {clean_code}.md')
                _mark_converted(db_conn, qp_code, out_path, pc_count)
                converted_count += 1

            except Exception as e:
                print(f'[{abs_idx + 1}/{total}] ❌  Error for {qp_code}: {e}')
                import traceback; traceback.print_exc()
                failed_count += 1

            save_checkpoint(qp_code, abs_idx)

        if failed_count == 0:
            clear_checkpoint()
            print('\n✅  All QPs processed — checkpoint cleared.\n')
        else:
            print(f'\n⚠️  {failed_count} failed. Run with --resume to retry.\n')

    finally:
        if db_conn:
            try:
                db_conn.close()
            except Exception:
                pass

    print('================================================================================')
    print('📊 SUMMARY')
    print(f'   QPs Processed:          {total}')
    print(f'   Successfully Converted: {converted_count}')
    print(f'   Zero-PC (image PDFs):   {zero_pc_count}')
    print(f'   Failed / Missing PDF:   {failed_count}')
    print(f'   Output Directory:       {MD_DIR}')
    print('================================================================================\n')


if __name__ == '__main__':
    main()
