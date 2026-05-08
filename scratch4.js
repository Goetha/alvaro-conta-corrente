import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data: dre } = await supabase.from('dre_linhas').select('*, plano_contas(codigo, nome)');
  console.log("DRE Linhas na base:");
  dre.forEach(d => {
    console.log(`- ${d.nome} (codigo_conta: ${d.codigo_conta}, plano_conta_id: ${d.plano_conta_id}, joined_codigo: ${d.plano_contas?.codigo})`);
  });
}

main();
