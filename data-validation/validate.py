import csv
import sys
import os

INPUT_PATH  = os.path.join(os.path.dirname(__file__), '../files/messy.csv')
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '../files/messy_output.csv')

PASS = []
FAIL = []

def check(condition, message):
    if condition:
        print(f'PASS: {message}')
        PASS.append(message)
    else:
        print(f'FAIL: {message}')
        FAIL.append(message)

def load_csv(path):
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def main():
    print('Rhombus AI — Data Validation\n')

    try:
        input_rows  = load_csv(INPUT_PATH)
        output_rows = load_csv(OUTPUT_PATH)
    except FileNotFoundError as e:
        print(f'Error: Could not open the file — {e}')
        sys.exit(1)

    # 1. check columns are correct
    print('1. Columns')
    expected_columns = {'id', 'name', 'email', 'age', 'country', 'salary'}
    output_columns = set(output_rows[0].keys()) if output_rows else set()
    check(expected_columns == output_columns,
          f'Output has the right columns: {sorted(expected_columns)}')

    # 2. check same number of rows
    print('\n2. Row Count')
    check(len(output_rows) == len(input_rows),
          f'Same number of rows: {len(input_rows)} in, {len(output_rows)} out')

    # 3. check names are properly capitalised
    print('\n3. Names')
    bad_names = []
    for row in output_rows:
        name = row.get('name', '').strip()
        if name and name != name.title():
            bad_names.append(name)
    check(len(bad_names) == 0,
          f'All names are properly capitalised (bad: {bad_names or "none"})')

    # 4. check emails have an @ symbol
    print('\n4. Emails')
    bad_emails = []
    for row in output_rows:
        email = row.get('email', '').strip()
        if email and '@' not in email:
            bad_emails.append(email)
    check(len(bad_emails) == 0,
          f'All emails contain @ (bad: {bad_emails or "none"})')

    # 5. check country names are written in full
    print('\n5. Countries')
    short_countries = []
    for row in output_rows:
        country = row.get('country', '').strip()
        if country.upper() in ('US', 'USA', 'UK', 'AU'):
            short_countries.append(country)
    check(len(short_countries) == 0,
          f'No short country codes remain (found: {short_countries or "none"})')

    # 6. check no ages are missing
    print('\n6. Ages')
    empty_ages = [r for r in output_rows if not r.get('age', '').strip()]
    check(len(empty_ages) == 0,
          f'No missing ages in output (empty: {len(empty_ages)})')

    non_numeric_ages = []
    for row in output_rows:
        age = row.get('age', '').strip()
        if age:
            try:
                float(age)
            except ValueError:
                non_numeric_ages.append(age)
    check(len(non_numeric_ages) == 0,
          f'All ages are numbers (non-numeric: {non_numeric_ages or "none"})')

    # 7. check no extra rows were added
    print('\n7. No Extra Rows')
    check(len(output_rows) <= len(input_rows),
          f'Output has no more rows than input ({len(output_rows)} vs {len(input_rows)})')

    # summary
    print(f'\nResults: {len(PASS)} passed, {len(FAIL)} failed')
    if FAIL:
        print('Failed checks:')
        for f in FAIL:
            print(f' - {f}')
        sys.exit(1)
    else:
        print('All checks passed')

if __name__ == '__main__':
    main()