import fs from 'fs';

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

const filePath = '/Users/mac/Downloads/CONTA CORRENTE RIO LOG (17) (1) - R PEDÁGIO.csv';
const fileContent = fs.readFileSync(filePath, 'latin1');
const lines = fileContent.split('\n');

const records = [];
let skipped = [];

for (let i = 2; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  
  if (cols.length < 10) {
    skipped.push({ line: i+1, reason: 'less than 10 cols', text: line });
    continue;
  }

  const data = parseDate(cols[0]);
  if (!data) {
    skipped.push({ line: i+1, reason: 'invalid date', text: line, col0: cols[0] });
    continue;
  }

  const comp = cols[1]?.replace(/"/g, '').trim() || null;
  const documento = cols[2]?.replace(/"/g, '').trim() || null;
  const parceiro = cols[3]?.replace(/"/g, '').trim() || null;
  const historico = cols[4]?.replace(/"/g, '').trim() || null;
  const placa = cols[5]?.replace(/"/g, '').trim() || null;
  
  const km = parseNumber(cols[6]) || null;
  const quantidade = parseNumber(cols[7]) || null;
  
  const codigo = '69';
  const conta = 'PEDÁGIO';
  
  const receita = parseCurrency(cols[10]);
  const despesa = parseCurrency(cols[11]);
  
  let valor = 0;
  if (despesa !== 0) valor = Math.abs(despesa);
  else if (receita !== 0) valor = -Math.abs(receita);

  records.push({
    lineNum: i+1,
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
    valor,
    rawDespesa: cols[11],
    rawReceita: cols[10]
  });
}

fs.writeFileSync('/Users/mac/Alvaro conta corrente/scratch/test_pedagio_output.json', JSON.stringify({ records, skipped }, null, 2));
console.log(`Parsed ${records.length} records, skipped ${skipped.length}`);
