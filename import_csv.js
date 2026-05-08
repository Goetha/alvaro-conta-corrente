so que import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function parseCurrency(str) {
  if (!str) return 0;
  str = str.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(str) || 0;
}

function parseNumber(str) {
  if (!str) return null;
  str = str.replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(str) || null;
}

function parseDate(str) {
  if (!str) return null;
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

async function run() {
  const filePath = '/Users/mac/Downloads/Pasta 2(CONTA CORRENTE).csv';
  const fileContent = fs.readFileSync(filePath, 'latin1');
  const lines = fileContent.split('\n');

  const records = [];

  // skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(';');
    const dataStr = cols[0];
    if (!dataStr || dataStr.split('/').length !== 3) continue;

    const data = parseDate(dataStr);
    const comp = cols[1]?.trim() || null;
    const numero = cols[2]?.trim() || null;
    const parceiro = cols[3]?.trim() || null;
    const historico = cols[4]?.trim() || null;
    const placa = cols[5]?.trim() || null;
    const km = parseNumber(cols[6]);
    const qtdade = parseNumber(cols[7]);
    const codigo = cols[8]?.trim() || null;
    const conta = cols[9]?.trim() || null;
    const receita = parseCurrency(cols[10]);
    const despesa = parseCurrency(cols[11]);
    const saldo = parseCurrency(cols[12]);
    const conciliado = cols[13] ? cols[13].toUpperCase().includes('CONCILIADO') : false;

    records.push({
      data, comp, numero, parceiro, historico, placa, km, qtdade, codigo, conta, receita, despesa, saldo, conciliado
    });
  }

  console.log(`Parsed ${records.length} records. Inserting...`);

  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    const { error } = await supabase.from('lancamentos').insert(batch);
    if (error) {
      console.error('Error inserting batch:', error);
      return;
    }
    console.log(`Inserted ${i + batch.length} / ${records.length}`);
  }

  console.log('Import completed successfully!');
}

run();
