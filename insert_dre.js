import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const operationalCodes = [
  { codigo: '2', nome: 'FRETES', tipo: 'soma' },
  { codigo: '55', nome: 'DIESEL CAVALO (DRE)', tipo: 'subtrai' },
  { codigo: '56', nome: 'DIESEL EQ. FRIO', tipo: 'subtrai' },
  { codigo: '52', nome: 'ARLA', tipo: 'subtrai' },
  { codigo: '5', nome: 'RENDIMENTOS APL. FIN.', tipo: 'soma' },
  { codigo: '6', nome: 'VENDA DE BENS', tipo: 'soma' },
  { codigo: '7', nome: 'DESCONTOS', tipo: 'subtrai' },
  { codigo: '8', nome: 'REEMBOLSO DE DESPESAS', tipo: 'soma' }
];

async function main() {
  // Get plano_contas to get IDs
  const { data: planoContas } = await supabase.from('plano_contas').select('id, codigo');
  const planoMap = new Map(planoContas.map(p => [String(p.codigo), p.id]));

  // Get current DRE lines to avoid duplicates and handle order
  const { data: existingDre } = await supabase.from('dre_linhas').select('codigo_conta');
  const existingCodes = new Set(existingDre.map(e => String(e.codigo_conta)));

  let maxOrdem = existingDre.length + 1;
  const toInsert = [];

  for (const item of operationalCodes) {
    if (!existingCodes.has(item.codigo)) {
      const plano_conta_id = planoMap.get(item.codigo);
      if (plano_conta_id) {
        toInsert.push({
          nome: item.nome,
          codigo_conta: item.codigo,
          plano_conta_id: plano_conta_id,
          tipo_calculo: item.tipo,
          ordem: maxOrdem++,
          cor_fundo: item.tipo === 'soma' ? '#f0fdf4' : '#fff1f2',
          cor_texto: item.tipo === 'soma' ? '#166534' : '#991b1b'
        });
      }
    }
  }

  if (toInsert.length > 0) {
    console.log(`Inserindo ${toInsert.length} novas linhas no DRE...`);
    const { error } = await supabase.from('dre_linhas').insert(toInsert);
    if (error) console.error('Erro na inserção:', error);
    else console.log('Sucesso! Linhas inseridas:', toInsert.map(i => i.nome));
  } else {
    console.log('Nenhuma linha operacional nova para inserir no DRE.');
  }
}

main();
