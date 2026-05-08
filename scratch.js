import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const rawInput = `3	 RECURSOS ALVARO
4	 RECURSOS CLODO
74	 TAXAS
77	 TARIFA BANCARIA
59	 ENTRADA FINANCIAMENTO CAPITAL SÓCIOS
55	 DIESEL CAVALO
56	 DIESEL EQ. FRIO
5	 RENDIMENTOS APL. FIN.
76	 LAVAÇÃO
60	 PARCELA FINANCIAMENTO
78	 EXAMES
81	 PIS
82	 COFINS
75	 EQUIPAMENTOS RASTREADOR
65	 MANUTENÇÃO CAVALO
72	 SALÁRIO
84	 CARTÃO ALIMENTAÇÃO
66	 MANUTENÇÃO EQ. FRIO
83	 SEGURO DE VIDA
68	 OUTROS
62	 INSS
58	 FGTS
52	 ARLA
2	 FRETES
79	 IRPJ
80	 CSLL
7	 DESCONTOS
8	 REEMBOLSO DE DESPESAS
70	 MENSALIDADE RASTREADOR
73	 SENSOR DE FADIGA
86	 SEGURO TOTAL CAMINHÃO / CARRETA
69	 PEDÁGIO
88	 TAXAS DETRAN
89	 CONTABILIDADE
64	 MANUTENÇÃO CARRETA
91	 UNIFORMES
87	 PNEUS NOVOS
90	 PNEUS RECAPE
92	 DESPACHANTE
93	 IPVA
85	 ICMS
94	 MANUTENÇÃO RASTREADOR
51	 13º SALÁRIO
54	 DESPESA DE ESTRADA
57	 FÉRIAS
96	 CONSÓRCIO MAGGI 881
97	 CONSÓRCIO BANCO DO BRASIL
98	 ENTRADA FINANCIAMENTO CAPITAL EMPRESA
99	 TAXAS FCO
100	 DIFAL
67	 MULTAS
61	 SICOOB
6	 VENDA DE BENS
10	 TRANSFERENCIA
9	 EMPRESTIMO FCO F.C
63	 TRANSFERENCIAS`;

async function main() {
  const lines = rawInput.split('\n');
  const codeMap = new Map();

  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const codigo = match[1].trim();
      const nome = match[2].trim();
      codeMap.set(codigo, nome);
    }
  }

  const { data: existing, error } = await supabase.from('plano_contas').select('*');
  if (error) {
    console.error('Error fetching existing', error);
    process.exit(1);
  }
  
  const existingCodes = new Set(existing.map(e => String(e.codigo)));
  
  const toInsert = [];
  for (const [codigo, nome] of codeMap.entries()) {
    if (!existingCodes.has(codigo)) {
      toInsert.push({ codigo, nome });
    }
  }

  console.log("Existing from DB count:", existing.length);
  console.log("Codes from input count:", codeMap.size);
  console.log("Missing codes to insert:", toInsert.map(t => t.codigo).join(', '));
}

main();
