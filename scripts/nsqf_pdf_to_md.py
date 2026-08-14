#!/usr/bin/env python3
"""
Sub-Step 1.2: PDF-to-Markdown Converter  (v3 — 3-part NOS, tighter heuristics)
Converts downloaded NCVET NSQF Curriculum PDFs (in data/pdfs/) into clean,
human-readable Markdown files (in data/md/).

v3 fixes vs v2:
  1. NOS_RE     → handles 3-part codes (NIE/ELE/N0810, DGT/VSQ/N0101)
  2. SECTION_RE → tightened (no false headings from "Table ...", numbered lists,
                  "Knowledge", "Skills", "Assessment", "Employability")
  3. join_continuations → safer 90-char threshold, also checks prev line ends
                          with a capitalized word (proper noun guard)
  4. LOCAL_DATABASE_URL → replaces legacy DATABASE_URL for DB tracking
  5. --resume checkpoint → data/.pdf2md_checkpoint.json; crash-safe restarts
  6. Zero-PC detection → tags pipeline_status='image_pdf_no_text' in DB
  7. Stale DB_PATH (SQLite) removed — SQLite permanently archived

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
    # LOCAL_DATABASE_URL is the correct env var post-architecture fix
    _PG_URL  = os.getenv('LOCAL_DATABASE_URL') or os.getenv('DATABASE_URL')
    _HAS_PG  = bool(_PG_URL) and 'neon.tech' not in (_PG_URL or '')
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

# Matches NSQF NOS/QP codes:
#   2-part: AGR/N0101, MEP/Q9901
#   3-part: NIE/ELE/N0810, DGT/VSQ/N0101, WBSC/HCS/Q0501
# Middle segment(s) (e.g. ELE, VSQ) are optional — {0,2} covers both forms.
NOS_RE = re.compile(
    r'^[A-Z]{2,10}(?:/[A-Z0-9]{2,10}){0,2}/[NQ]\d{3,4}\b',
    re.IGNORECASE
)

PC_RE = re.compile(r'^PC\s*\d+[.:]', re.IGNORECASE)

# Tightened SECTION_RE — only genuine structural headings.
# Removed: Table, Knowledge, Skills, Assessment, Employability, numbered list items.
# These were causing false #### headings throughout the corpus.
SECTION_RE = re.compile(
    r'^(Module\s+\d|NOS\s+\d|Unit\s+\d|Section\s+\d|'
    r'Performance\s+Criteria\s*$|Elements\s+and\s+Performance)',
    re.IGNORECASE
)

ENDS_SENT  = re.compile(r'[.;:]\s*$')
WHITESPACE = re.compile(r'\s+')

# Proper-noun guard for join_continuations:
# If the previous line ends with a capitalized word, it's likely a complete
# phrase and the next line is NOT a continuation (e.g. "...refer to Safety Guidelines")
ENDS_PROPER = re.compile(r'\b[A-Z][a-z]{2,}\s*$')


# ─────────────────────────────────────────────────────────────
# Table → Markdown
# ─────────────────────────────────────────────────────────────
def format_table_to_md(table):
    """Convert a pdfplumber 2-D table array to GFM Markdown table syntax."""
    if not table:
        return ""

    cleaned_rows = []
    for row in table:
        if not row:
            continue
        cleaned = [WHITESPACE.sub(' ', str(cell or '')).strip() for cell in row]
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
# Table text → dedup set
# ─────────────────────────────────────────────────────────────
def build_table_text_set(tables):
    """
    Collect every non-trivial cell string from all tables on a page.
    Used to skip re-outputting that content during the plain-text pass.
    Both the full string and an 80-char prefix key are stored so partial
    lines from mid-column breaks are also caught.
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


def line_in_table(line, table_set):
    """Return True if *line* is substantially covered by table content."""
    norm = WHITESPACE.sub(' ', line).strip()
    return norm in table_set or norm[:80] in table_set


# ─────────────────────────────────────────────────────────────
# Multi-column text extraction
# ─────────────────────────────────────────────────────────────
def extract_page_text(page):
    """
    Extract text using spatial layout awareness.
    layout=True tells pdfplumber/pdfminer to group words by column before
    joining, which prevents mid-sentence column breaks in 2-column NSQF PDFs.
    Falls back gracefully if the installed version doesn't support layout=True.
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
    Merge lines that are right-column continuations of a truncated left-column
    line.

    Heuristics (all must be true):
      - Current line starts with a lowercase letter
      - Previous line did NOT end with sentence-ending punctuation (. ; :)
      - Previous line did NOT end with a proper noun (capital word)
      - Previous line is shorter than 90 chars (not a full-width line)
      - Neither line is a structural element (PC, NOS code, heading, table)

    Threshold reduced from 110 → 90 to reduce false merges on large QPs.
    """
    if not raw_lines:
        return []

    result = [raw_lines[0]]

    for line in raw_lines[1:]:
        prev = result[-1]

        # Never merge structural elements
        if (line.startswith('|') or prev.startswith('|')
                or PC_RE.match(line) or NOS_RE.match(line)
                or SECTION_RE.match(line) or line.startswith('#')
                or PC_RE.match(prev) or NOS_RE.match(prev)):
            result.append(line)
            continue

        is_continuation = (
            bool(line)
            and line[0].islower()
            and not ENDS_SENT.search(prev)
            and not ENDS_PROPER.search(prev)   # proper-noun guard (new v3)
            and len(prev) < 90                  # tightened from 110 → 90
        )
        if is_continuation:
            result[-1] = prev + ' ' + line
        else:
            result.append(line)

    return result


# ─────────────────────────────────────────────────────────────
# Classify and format a single text line
# ─────────────────────────────────────────────────────────────
def classify_line(line):
    """
    Return (markdown_prefix, line_text).

    Priority order:
      1. NOS/QP code      → #### heading   (NOS section boundary)
      2. Structural header → #### heading   (Module/Section/Unit/Performance Criteria)
      3. PC line           → - list item    (PC1. description)
      4. Everything else   → plain text
    """
    if NOS_RE.match(line):
        return '####', line
    if SECTION_RE.match(line) and len(line) < 120:
        return '####', line
    if PC_RE.match(line):
        return '-', line
    return '', line


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

    Per-page strategy:
      1. Find tables  → render as GFM tables, build dedup set from their cells.
      2. Extract text from non-table page regions using layout=True.
      3. Skip any text line already present in the table dedup set.
      4. Join continuation lines (right-column fragments) with v3 heuristics.
      5. Classify and emit each line with the correct Markdown prefix.

    Returns: (out_md_path, byte_length, pc_count)
    """
    clean_qp = qp_code.replace('/', '_')
    md_lines = []
    pc_count = 0

    with pdfplumber.open(pdf_path) as pdf:
        num_pages = len(pdf.pages)
        md_lines.append(f'# Qualification Pack: {qp_name or qp_code}')
        md_lines.append(f'**QP Code**: `{qp_code}`  ')
        md_lines.append(f'**Total Document Pages**: {num_pages}  ')
        md_lines.append('---')
        md_lines.append('')

        for idx, page in enumerate(pdf.pages):

            # 1. Tables
            found_tables   = page.find_tables()
            table_bboxes   = [t.bbox for t in found_tables]
            raw_tables     = [t.extract() for t in found_tables]
            table_text_set = build_table_text_set(raw_tables)

            page_md = [f'### Page {idx + 1}', '']
            for raw_tbl in raw_tables:
                fmt = format_table_to_md(raw_tbl)
                if fmt:
                    page_md.append(fmt)

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
                    continue  # already in a rendered table

                prefix, text_out = classify_line(line)
                if prefix == '####':
                    page_md.append(f'#### {text_out}')
                elif prefix == '-':
                    page_md.append(f'- {text_out}')
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
def _get_qp_list(args):
    """
    Build the list of (qp_code, qp_name) tuples to process.
    Priority:
      1. --qp argument  → single QP
      2. --all / --limit → read from local PostgreSQL nsqf_qps if available,
                          otherwise scan PDF_DIR for .pdf files
    """
    if args.qp:
        clean = args.qp.replace('/', '_')
        return [(args.qp, clean)]

    if _HAS_PG:
        try:
            conn = psycopg2.connect(_PG_URL)
            cur  = conn.cursor()
            if args.all:
                cur.execute('SELECT qp_code, qp_name FROM nsqf_qps ORDER BY id ASC')
            else:
                cur.execute('SELECT qp_code, qp_name FROM nsqf_qps ORDER BY id ASC LIMIT %s',
                            (args.limit,))
            rows = cur.fetchall()
            cur.close(); conn.close()
            if rows:
                print(f'  [DB] Loaded {len(rows)} QP(s) from local PostgreSQL (hayadb).')
                return rows
        except Exception as e:
            print(f'  [DB] Local PG unavailable ({e}) — falling back to PDF directory scan.')

    # Fallback: scan PDF_DIR
    pdfs = sorted(f for f in os.listdir(PDF_DIR) if f.endswith('.pdf'))
    if not args.all:
        pdfs = pdfs[:args.limit]
    return [(p.replace('.pdf', '').replace('_', '/', 2), p.replace('.pdf', '')) for p in pdfs]


def _mark_converted(qp_code, md_path, pc_count):
    """Update pipeline_status in local hayadb. No-op if PG unavailable."""
    if not _HAS_PG:
        return
    try:
        conn = psycopg2.connect(_PG_URL)
        cur  = conn.cursor()
        if pc_count == 0:
            # Image-only or scanned PDF — no extractable text
            status = 'image_pdf_no_text'
        else:
            status = 'md_converted'
        cur.execute(
            "UPDATE nsqf_qps SET markdown_path = %s, pipeline_status = %s WHERE qp_code = %s",
            (md_path, status, qp_code)
        )
        conn.commit()
        cur.close(); conn.close()
    except Exception:
        pass  # DB update is optional; PDF→MD conversion already succeeded


# ─────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description='Convert NSQF PDFs to Markdown (v3 — 3-part NOS, tighter heuristics)'
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

    print('================================================================================')
    print('📝 [Sub-Step 1.2] PDF-to-MARKDOWN CONVERTER  (v3 — 3-part NOS, tighter heuristics)')
    print(f'   DB: {"local PostgreSQL (" + _PG_URL.split("@")[-1] + ")" if _HAS_PG else "No DB — disk-only mode"}')
    print('================================================================================\n')

    qp_list = _get_qp_list(args)
    if not qp_list:
        print('❌  No QPs found. Check PDF_DIR or DB.')
        return

    # Resume: skip already-completed QPs
    start_idx = 0
    if args.resume and not args.qp:
        cp = load_checkpoint()
        if cp:
            start_idx = cp.get('index', 0) + 1
            print(f'⏩  Resuming from index {start_idx} (after {cp["qp_code"]}).\n')

    total        = len(qp_list)
    to_process   = qp_list[start_idx:]
    print(f'Converting {len(to_process)} of {total} Qualification Pack(s)…\n')

    converted_count  = 0
    failed_count     = 0
    zero_pc_count    = 0

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
                tag = '⚠️  0 PCs (image PDF?)'
            else:
                tag = f'✅  {pc_count} PCs'

            print(f'[{abs_idx + 1}/{total}] {tag}  {byte_len / 1024:.1f} KB → {clean_code}.md')
            _mark_converted(qp_code, out_path, pc_count)
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
