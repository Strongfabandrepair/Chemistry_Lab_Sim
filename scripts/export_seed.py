"""Export the checked-in SQL reference datasets for credential-free use.
Only parses literal INSERT ... VALUES statements; never executes SQL.
"""
import json
import re
from pathlib import Path


def split_sql(text):
    result, start, depth, quoted, i = [], 0, 0, False, 0
    while i < len(text):
        char = text[i]
        if char == "'":
            if quoted and i + 1 < len(text) and text[i + 1] == "'":
                i += 2
                continue
            quoted = not quoted
        if not quoted:
            if char in '([': depth += 1
            elif char in ')]': depth -= 1
            elif char == ',' and depth == 0:
                result.append(text[start:i].strip())
                start = i + 1
        i += 1
    result.append(text[start:].strip())
    return result


def value(raw):
    raw = raw.removesuffix('::jsonb').removesuffix('::text[]').strip()
    if raw.upper() == 'NULL': return None
    if raw in ('true', 'false'): return raw == 'true'
    if raw.startswith('ARRAY['): return [value(x) for x in split_sql(raw[6:-1]) if x]
    if raw.startswith("'"):
        result = raw[1:-1].replace("''", "'")
        if result.startswith(('[', '{')):
            try: return json.loads(result)
            except json.JSONDecodeError: pass
        return result
    return float(raw) if '.' in raw else int(raw)

root = Path(__file__).resolve().parents[1]
for table, file in [('elements', '20251215025732_populate_periodic_table.sql'), ('molecules', '20251215153713_populate_molecular_database.sql'), ('tutorials', '20251215153713_populate_molecular_database.sql'), ('recipes', '20251215032715_add_known_recipes.sql')]:
    sql = (root / 'supabase/migrations' / file).read_text()
    match = re.search(r'INSERT INTO ' + table + r'\s*\((.*?)\)\s*VALUES\s*(.*?);', sql, re.S)
    columns = split_sql(match[1])
    records = [dict(zip(columns, [value(x) for x in split_sql(row.strip()[1:-1])])) for row in split_sql(re.sub(r'ON CONFLICT.*', '', match[2], flags=re.S).strip())]
    for idx, record in enumerate(records):
        record.setdefault('id', f'local-{table}-{idx + 1}')
        if table == 'elements': record.setdefault('half_life', None)
        if table == 'molecules':
            record.update(bond_angles=[], safety_info={}, created_at='', updated_at='')
        if table == 'recipes': record.setdefault('volume', 1)
    (root / 'src/data' / f'{table}.json').write_text(json.dumps(records, indent=2) + '\n')
    print(table, len(records))
