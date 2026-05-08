
const { createClient } = require('@supabase/supabase-js');
const url = 'https://lpcxpytidoyzcbfiqsll.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY3hweXRpZG95emNiZmlxc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwOTI4NTQsImV4cCI6MjA2MjY2ODg1NH0.ogbLCotp-vtoiK3FPKHWJdM9GxG86Bwgyu8Ul5d7ZXo';
const supabase = createClient(url, key);

const platesToCavalo = [
  'RBX2I25', 'RCA4F95', 'SCO0E03', 'SCO0D93', 
  'TFV6B79', 'TGG1C03', 'TFX8B84', 'TGB4J95'
];

async function run() {
  const { data: items } = await supabase.from('veiculos').select('*');
  const existingPlates = items.map(v => v.placa);
  const hasTipoColumn = items.length > 0 && 'tipo' in items[0];

  for (const placa of platesToCavalo) {
    if (!existingPlates.includes(placa)) {
      console.log(`Adding ${placa} as Cavalo...`);
      const payload = { placa, descricao: 'Cavalo' };
      if (hasTipoColumn) {
        payload.tipo = 'cavalo';
      } else {
        const meta = JSON.stringify({ tipo: 'cavalo', cavalo_id: null });
        payload.descricao = `[V-DATA:${meta}] Cavalo`;
      }
      await supabase.from('veiculos').insert(payload);
    } else {
      console.log(`${placa} already exists.`);
      // Optional: Update if needed? The user said "registre somente o que nao tem"
    }
  }
}
run();
