import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const codesToSetAsExpense = [
  '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
  '61', '62', '63', '64', '65', '66', '67', '68', '69', '70',
  '71', '72', '73', '74', '75', '76', '77', '78', '79', '80',
  '81', '82', '83', '84', '85', '86', '87', '88', '89', '90',
  '91', '92', '93', '94', '95', '96', '97', '98', '99', '100'
];

async function main() {
  // Get plano_contas to get IDs and Names
  const { data: planoContas } = await supabase.from('plano_contas').select('id, codigo, nome');
  const planoMap = new Map(planoContas.map(p => [String(p.codigo), { id: p.id, nome: p.nome }]));

  // Get current DRE lines
  const { data: existingDre } = await supabase.from('dre_linhas').select('*');
  const existingMap = new Map(existingDre.map(e => [String(e.codigo_conta), e.id]));

  const toInsert = [];
  const toUpdate = [];

  let maxOrdem = existingDre.reduce((max, r) => Math.max(max, r.ordem || 0), 0) + 1;

  for (const codigo of codesToSetAsExpense) {
    const existingId = existingMap.get(codigo);
    const planoInfo = planoMap.get(codigo);
    
    if (!planoInfo) continue;

    if (existingId) {
      toUpdate.push({
        id: existingId,
        nome: planoInfo.nome,
        tipo_calculo: 'subtrai',
        cor_fundo: '#fff1f2',
        cor_texto: '#991b1b'
      });
    } else {
      toInsert.push({
        nome: planoInfo.nome,
        codigo_conta: codigo,
        plano_conta_id: planoInfo.id,
        tipo_calculo: 'subtrai',
        ordem: maxOrdem++,
        cor_fundo: '#fff1f2',
        cor_texto: '#991b1b'
      });
    }
  }

  if (toUpdate.length > 0) {
    console.log(`Atualizando ${toUpdate.length} linhas para Despesa...`);
    for (const up of toUpdate) {
      await supabase.from('dre_linhas').update(up).eq('id', up.id);
    }
  }

  if (toInsert.length > 0) {
    console.log(`Inserindo ${toInsert.length} novas linhas de Despesa...`);
    const { error } = await supabase.from('dre_linhas').insert(toInsert);
    if (error) console.error('Erro na inserção:', error);
  }

  console.log('Finalizado! Todas as contas de 51 a 100 agora são tratadas como Despesas no DRE.');
}

main();
