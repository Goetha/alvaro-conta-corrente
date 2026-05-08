import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpcxpytidoyzcbfiqsll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY3hweXRpZG95emNiZmlxc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwOTI4NTQsImV4cCI6MjA2MjY2ODg1NH0.ogbLCotp-vtoiK3FPKHWJdM9GxG86Bwgyu8Ul5d7ZXo';
const supabase = createClient(supabaseUrl, supabaseKey);

function parseCurrency(str) {
  if (!str || str.trim() === 'R$ -' || str.trim() === 'R$ -   ' || str.trim() === '') return 0;
  // Handle negative values like -R$ 501,36
  let sign = 1;
  if (str.includes('-')) sign = -1;
  str = str.replace(/R\$\s*/g, '').replace(/-/g, '').replace(/\./g, '').replace(',', '.').trim();
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val * sign;
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
  if (y === '0204') y = '2024'; 
  if (y.length !== 4) return null;
  return `${y}-${m}-${d}`;
}

async function run() {
  const filePath = '/Users/mac/Downloads/CONTA CORRENTE RIO LOG (17) (1)(CONTAS A RECEBER).csv';
  console.log(`Reading file: ${filePath}`);
  
  const fileContent = fs.readFileSync(filePath, 'latin1');
  const lines = fileContent.split('\n');

  const records = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(';');
    if (cols.length < 10) continue;

    const data = parseDate(cols[0]);
    if (!data) continue;

    const doc_magna = cols[1]?.trim() || null;
    const doc_riolog = cols[2]?.trim() || null;
    const pagador = cols[3]?.trim() || null;
    const cliente = cols[4]?.trim() || null;
    const placa = cols[6]?.trim() || null; // Wait, check Placa index again. Col 6 is Placa.
    const origem = cols[6]?.trim() || null; // Wait, let's re-verify.
    // Index verification from tr/cat:
    // 1: DATA (0)
    // 2: MAGNA (1)
    // 3: RIOLOG (2)
    // 4: PAGADOR (3)
    // 5: CLIENTE (4)
    // 6: PLACA (5)
    // 7: ORIGEM (6)
    // 8: DESTINO (7)
    // 9: PESO (8)
    
    const placa_final = cols[5]?.trim() || null;
    const origem_final = cols[6]?.trim() || null;
    const destino_final = cols[7]?.trim() || null;
    const peso_final = parseNumber(cols[8]);
    
    const data_vencimento = parseDate(cols[16]);
    const icms = parseCurrency(cols[17]);
    const seguro = parseCurrency(cols[18]);
    const valor_a_receber = parseCurrency(cols[20]);
    const valor_recebido = parseCurrency(cols[22]);
    const ajustes = parseCurrency(cols[23]);
    const data_recebimento = parseDate(cols[25]);

    records.push({
      data,
      doc_magna,
      doc_riolog,
      pagador,
      cliente,
      placa: placa_final,
      origem: origem_final,
      destino: destino_final,
      peso: peso_final,
      data_vencimento,
      icms,
      seguro,
      valor_a_receber,
      valor_recebido,
      ajustes,
      data_recebimento
    });
  }

  console.log(`Parsed ${records.length} records. Re-importing into 'contas_receber'...`);

  await supabase.from('contas_receber').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const totalAReceber = records.reduce((s, r) => s + r.valor_a_receber, 0);
  console.log('Total A Receber parsed:', totalAReceber);

  for (let i = 0; i < records.length; i += 200) {
    const batch = records.slice(i, i + 200);
    const { error } = await supabase.from('contas_receber').insert(batch);
    if (error) {
      console.error(`Error at ${i}:`, error.message);
      return;
    }
    console.log(`Inserted ${i + batch.length} / ${records.length}`);
  }

  console.log('Import to RECEBER completed successfully!');
}

run();
