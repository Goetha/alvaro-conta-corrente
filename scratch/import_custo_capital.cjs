const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient('https://lpcxpytidoyzcbfiqsll.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY3hweXRpZG95emNiZmlxc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwOTI4NTQsImV4cCI6MjA2MjY2ODg1NH0.ogbLCotp-vtoiK3FPKHWJdM9GxG86Bwgyu8Ul5d7ZXo');

async function importData() {
  const csvPath = '/Users/mac/Downloads/CONTA CORRENTE RIO LOG (17) (1)(CUSTO DE CAPITAL).csv';
  const content = fs.readFileSync(csvPath, 'utf-8'); // Let's hope utf-8 is enough or we clean it
  const lines = content.split('\n');
  
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(';');
    if (parts.length < 5) continue;
    
    const dataAporteRaw = parts[0].trim();
    const historico = parts[1].trim();
    const valorAporteRaw = parts[2].trim();
    const periodoAporte = parts[3].trim();
    const custoCapitalRaw = parts[4].trim();
    
    if (!dataAporteRaw && !historico) continue; // Skip lines without basic info
    
    // Parse Date DD/MM/YYYY to YYYY-MM-DD
    let data_aporte = null;
    if (dataAporteRaw) {
      const dParts = dataAporteRaw.split('/');
      if (dParts.length === 3) {
        data_aporte = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
      }
    }
    
    // Clean currency/numbers
    const cleanNum = (str) => {
      if (!str) return 0;
      return parseFloat(str.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
    };
    
    const valor_aporte = cleanNum(valorAporteRaw);
    const custo_capital = cleanNum(custoCapitalRaw);
    
    records.push({
      data_aporte: data_aporte || new Date().toISOString().split('T')[0],
      historico: historico || 'Aporte',
      valor_aporte,
      periodo_aporte: periodoAporte,
      custo_capital
    });
  }
  
  console.log(`Parsed ${records.length} records. Inserting...`);
  
  const { data, error } = await supabase.from('custo_capital').insert(records);
  
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted all records!');
  }
}

importData();
