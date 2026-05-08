import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const codesToSetAsRevenue = [
  { codigo: '1', nome: 'FRETE FR' },
  { codigo: '2', nome: 'FRETES' },
  { codigo: '3', nome: 'RECURSOS ALVARO' },
  { codigo: '4', nome: 'RECURSOS CLODO' },
  { codigo: '5', nome: 'RENDIMENTOS APL. FIN.' },
  { codigo: '6', nome: 'VENDA DE BENS' },
  { codigo: '7', nome: 'DESCONTOS' },
  { codigo: '8', nome: 'REEMBOLSO DE DESPESAS' },
  { codigo: '9', nome: 'EMPRESTIMO FCO F.C' },
  { codigo: '10', nome: 'TRANSFERENCIA' }
];

async function main() {
  // Get plano_contas to get IDs
  const { data: planoContas } = await supabase.from('plano_contas').select('id, codigo');
  const planoMap = new Map(planoContas.map(p => [String(p.codigo), p.id]));

  // Get current DRE lines
  const { data: existingDre } = await supabase.from('dre_linhas').select('*');
  const existingMap = new Map(existingDre.map(e => [String(e.codigo_conta), e.id]));

  const toInsert = [];
  const toUpdate = [];

  let maxOrdem = existingDre.reduce((max, r) => Math.max(max, r.ordem || 0), 0) + 1;

  for (const item of codesToSetAsRevenue) {
    const existingId = existingMap.get(item.codigo);
    
    if (existingId) {
      toUpdate.push({
        id: existingId,
        nome: item.nome,
        tipo_calculo: 'soma',
        cor_fundo: '#f0fdf4',
        cor_texto: '#166534'
      });
    } else {
      const plano_conta_id = planoMap.get(item.codigo);
      if (plano_conta_id) {
        toInsert.push({
          nome: item.nome,
          codigo_conta: item.codigo,
          plano_conta_id: plano_conta_id,
          tipo_calculo: 'soma',
          ordem: maxOrdem++,
          cor_fundo: '#f0fdf4',
          cor_texto: '#166534'
        });
      }
    }
  }

  if (toUpdate.length > 0) {
    console.log(`Atualizando ${toUpdate.length} linhas para Receita...`);
    for (const up of toUpdate) {
      await supabase.from('dre_linhas').update(up).eq('id', up.id);
    }
  }

  if (toInsert.length > 0) {
    console.log(`Inserindo ${toInsert.length} novas linhas de Receita...`);
    const { error } = await supabase.from('dre_linhas').insert(toInsert);
    if (error) console.error('Erro na inserção:', error);
  }

  console.log('Finalizado! Todas as contas de 1 a 10 agora são tratadas como Receitas no DRE.');
}

main();
