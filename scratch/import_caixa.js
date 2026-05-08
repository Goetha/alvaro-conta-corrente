import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpcxpytidoyzcbfiqsll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY3hweXRpZG95emNiZmlxc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwOTI4NTQsImV4cCI6MjA2MjY2ODg1NH0.ogbLCotp-vtoiK3FPKHWJdM9GxG86Bwgyu8Ul5d7ZXo';
const supabase = createClient(supabaseUrl, supabaseKey);

function parseCurrency(str) {
  if (!str) return 0;
  // Remove "R$ ", handle dots as thousand separators and comma as decimal
  str = str.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

function parseDate(str) {
  if (!str) return null;
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  // Convert DD/MM/YYYY to YYYY-MM-DD
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

async function run() {
  const filePath = '/Users/mac/Downloads/CONTA CORRENTE RIO LOG (17) (1)(CAIXA).csv';
  console.log(`Reading file: ${filePath}`);
  
  const fileContent = fs.readFileSync(filePath, 'latin1');
  const lines = fileContent.split('\n');

  const records = [];

  // Skip headers (data starts from line 6 in the head output, which is index 5)
  for (let i = 5; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(';');
    if (cols.length < 10) continue;

    const dataStr = cols[0];
    if (!dataStr || !dataStr.includes('/')) continue;

    const data = parseDate(dataStr);
    if (!data) continue;

    const comp = cols[1]?.trim() || null;
    const numero = cols[2]?.trim() || null;
    const parceiro = cols[3]?.trim() || null;
    const historico = cols[4]?.trim() || null;
    const placa = cols[5]?.trim() || null;
    const km = cols[6]?.trim() || null; // Keeping as text
    const qtdade = cols[7]?.trim() || null; // Keeping as text
    const codigo = cols[8]?.trim() || null;
    const conta = cols[9]?.trim() || null;
    const receita = parseCurrency(cols[10]);
    const despesa = parseCurrency(cols[11]);
    const saldo = parseCurrency(cols[12]);
    const conciliado = cols[13] ? cols[13].toUpperCase().includes('BAIXADO') : false;

    records.push({
      data, comp, numero, parceiro, historico, placa, km, qtdade, codigo, conta, receita, despesa, saldo, conciliado,
      tipo: receita > 0 ? 'receita' : 'despesa'
    });
  }

  console.log(`Parsed ${records.length} records. Inserting into 'caixa' table...`);

  for (let i = 0; i < records.length; i += 200) {
    const batch = records.slice(i, i + 200);
    const { error } = await supabase.from('caixa').insert(batch);
    if (error) {
      console.error(`Error inserting batch at index ${i}:`, error.message);
      // Continue to next batch instead of stopping entirely?
      // For now let's stop to see what's wrong.
      return;
    }
    console.log(`Inserted ${i + batch.length} / ${records.length}`);
  }

  console.log('Import to CAIXA completed successfully!');
}

run();
