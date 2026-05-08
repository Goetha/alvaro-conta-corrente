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
  const { data: dre } = await supabase.from('dre_linhas').select('*').eq('codigo_conta', 'OPERACAO_ARITMETICA');
  console.log("OPERACAO_ARITMETICA lines:");
  dre.forEach(d => {
    console.log(`- ${d.nome} (${d.id_referencia_1} ${d.operacao_aritmetica} ${d.id_referencia_2})`);
  });
}

main();
