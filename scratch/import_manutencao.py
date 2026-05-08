import csv
import json
import re
import urllib.request
from datetime import datetime

CSV_PATH = '/Users/mac/Downloads/CONTA CORRENTE RIO LOG (17) (1) - R MANUTENÇÂO.csv'
API_URL = 'https://lpcxpytidoyzcbfiqsll.supabase.co/rest/v1/contas_pagar_manutencao'
API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY3hweXRpZG95emNiZmlxc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwOTI4NTQsImV4cCI6MjA2MjY2ODg1NH0.ogbLCotp-vtoiK3FPKHWJdM9GxG86Bwgyu8Ul5d7ZXo'

def parse_br_money(value):
    if not value: return 0
    clean = re.sub(r'[^\d,-]', '', value).replace(',', '.')
    try:
        return float(clean)
    except:
        return 0

def parse_date(value):
    if not value: return None
    try:
        return datetime.strptime(value.strip(), '%d/%m/%Y').strftime('%Y-%m-%d')
    except:
        return None

items = []
with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader) # Skip header
    for row in reader:
        if len(row) < 12: continue
        data = parse_date(row[0])
        if not data: continue
        
        valor = parse_br_money(row[11])
        if valor == 0: continue # Skip zero values
        
        item = {
            "data": data,
            "comp": row[1].strip(),
            "documento": row[2].strip(),
            "parceiro": row[3].strip(),
            "historico": row[4].strip(),
            "placa": row[5].strip(),
            "km": row[6].strip() if row[6].strip() else None,
            "quantidade": row[7].strip() if row[7].strip() else None,
            "codigo": row[8].strip(),
            "conta": row[9].strip(),
            "valor": valor
        }
        items.append(item)

print(f"Found {len(items)} maintenance items. Importing...")

headers = {
    'apikey': API_KEY,
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

# Split into chunks of 100 to avoid request size limits
chunk_size = 100
for i in range(0, len(items), chunk_size):
    chunk = items[i:i + chunk_size]
    req = urllib.request.Request(API_URL, data=json.dumps(chunk).encode(), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Chunk {i//chunk_size + 1} imported.")
    except Exception as e:
        print(f"Error importing chunk {i//chunk_size + 1}: {e}")
