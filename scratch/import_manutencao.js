import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpcxpytidoyzcbfiqsll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY3hweXRpZG95emNiZmlxc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwOTI4NTQsImV4cCI6MjA2MjY2ODg1NH0.ogbLCotp-vtoiK3FPKHWJdM9GxG86Bwgyu8Ul5d7ZXo';
const supabase = createClient(supabaseUrl, supabaseKey);

function parseCurrency(str) {
  if (!str || str.trim() === '') return 0;
  let sign = 1;
  if (str.includes('-')) sign = -1;
  str = str.replace(/R\$\s*/g, '').replace(/-/g, '').replace(/\./g, '').replace(/"/g, '').replace(',', '.').trim();
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val * sign;
}

function parseNumber(str) {
  if (!str) return 0;
  str = str.replace(/\./g, '').replace(',', '.').replace(/"/g, '').trim();
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
  if (y.length !== 4) return null;
  return `${y}-${m}-${d}`;
}

async function run() {
  const filePath = '/Users/mac/Downloads/CONTA CORRENTE RIO LOG (17) (1) - R MANUTENÇÂO.csv';
  console.log(`Reading file: ${filePath}`);
  
  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    fileContent = fs.readFileSync(filePath, 'latin1');
  }
  
  const lines = fileContent.split('\n');
  const records = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma ignoring commas inside quotes
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    if (cols.length < 10) continue;

    const data = parseDate(cols[0]);
    if (!data) continue;

    const comp = cols[1]?.replace(/"/g, '').trim() || null;
    const documento = cols[2]?.replace(/"/g, '').trim() || null;
    const parceiro = cols[3]?.replace(/"/g, '').trim() || null;
    const historico = cols[4]?.replace(/"/g, '').trim() || null;
    const placa = cols[5]?.replace(/"/g, '').trim() || null;
    
    const km = parseNumber(cols[6]) || null;
    const quantidade = parseNumber(cols[7]) || null;
    
    const codigo = cols[8]?.replace(/"/g, '').trim() || null;
    const conta = cols[9]?.replace(/"/g, '').trim() || null;
    
    // As the file is Manutenção, we only care about expenses. If there's receita, we can treat it as negative expense or just value.
    // Let's assume despesa is the 'valor' column in the schema.
    const receita = parseCurrency(cols[10]);
    const despesa = parseCurrency(cols[11]);
    
    let valor = 0;
    if (despesa !== 0) valor = despesa;
    else if (receita !== 0) valor = -receita;

    records.push({
      data,
      comp,
      documento,
      parceiro,
      historico,
      placa,
      km,
      quantidade,
      codigo,
      conta,
      valor
    });
  }

  console.log(`Parsed ${records.length} records. Uploading to 'contas_pagar_manutencao'...`);

  await supabase.from('contas_pagar_manutencao').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const totalValor = records.reduce((s, r) => s + r.valor, 0);
  console.log('Total Valor parsed:', totalValor);

  for (let i = 0; i < records.length; i += 200) {
    const batch = records.slice(i, i + 200);
    const { error } = await supabase.from('contas_pagar_manutencao').insert(batch);
    if (error) {
      console.error(`Error at ${i}:`, error.message);
      return;
    }
    console.log(`Inserted ${i + batch.length} / ${records.length}`);
  }

  console.log('Import to MANUTENCAO completed successfully!');
}

run();
