import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpcxpytidoyzcbfiqsll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY3hweXRpZG95emNiZmlxc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwOTI4NTQsImV4cCI6MjA2MjY2ODg1NH0.ogbLCotp-vtoiK3FPKHWJdM9GxG86Bwgyu8Ul5d7ZXo';
const supabase = createClient(supabaseUrl, supabaseKey);

function parseCurrency(str) {
  if (!str || str.trim() === 'R$ -' || str.trim() === 'R$ -   ') return 0;
  str = str.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

function parseNumber(str) {
  if (!str) return 0;
  str = str.replace(/\./g, '').replace(',', '.').trim();
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

function parseDate(str) {
  if (!str || str.trim() === '') return null;
  const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;
  let d = match[1].padStart(2, '0');
  let m = match[2].padStart(2, '0');
  let y = match[3].trim();
  if (y.length === 2) y = '20' + y;
  if (y === '0204') y = '2024'; // Correct specific typo in CSV
  if (y.length !== 4) return null;
  return `${y}-${m}-${d}`;
}

function excelDateToISO(serialStr) {
  if (!serialStr || serialStr.trim() === '') return null;
  if (serialStr.includes('/')) return parseDate(serialStr);
  const serial = parseNumber(serialStr);
  if (serial < 30000 || serial > 60000) return null; 
  const date = new Date((serial - 25569) * 86400 * 1000);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

async function run() {
  const filePath = '/Users/mac/Downloads/CONTA CORRENTE RIO LOG (17) (1)(CONTAS A PAGAR DIESEL).csv';
  console.log(`Reading file: ${filePath}`);
  
  const fileContent = fs.readFileSync(filePath, 'latin1');
  const lines = fileContent.split('\n');

  const records = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(';');
    if (cols.length < 10) continue;

    const data_emissao = parseDate(cols[0]);
    if (!data_emissao) continue;

    const data_pagamento = parseDate(cols[1]);
    const documento = cols[3]?.trim() || null;
    const fornecedor = cols[4]?.trim() || null;
    const observacao = cols[5]?.trim() || null;
    const placa = cols[6]?.trim() || null;
    const km = parseNumber(cols[7]);
    const quantidade = parseNumber(cols[8]);
    const valor_a_pagar = parseCurrency(cols[9]);
    const valor_unitario = parseCurrency(cols[10]);
    const valor_pago = parseCurrency(cols[13]);
    const data_vencimento = excelDateToISO(cols[16]) || data_pagamento || data_emissao;

    records.push({
      data_emissao, data_pagamento, data_vencimento, documento, fornecedor, observacao, placa, km, quantidade, valor_a_pagar, valor_unitario, valor_pago
    });
  }

  console.log(`Parsed ${records.length} records. Re-importing...`);

  await supabase.from('contas_pagar_diesel').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  for (let i = 0; i < records.length; i += 200) {
    const batch = records.slice(i, i + 200);
    const { error } = await supabase.from('contas_pagar_diesel').insert(batch);
    if (error) {
      console.error(`Error at ${i}:`, error.message);
      return;
    }
    console.log(`Inserted ${i + batch.length} / ${records.length}`);
  }

  console.log('Import to DIESEL completed successfully!');
}

run();
