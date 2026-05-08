import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const TABLE = 'dre_linhas';

export function useDreConfig() {
  return useQuery({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(`
          *,
          plano_contas (
            codigo,
            nome
          )
        `)
        .order('ordem', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateDreLinha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}

export function useUpdateDreLinha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}

export function useDeleteDreLinha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}

// Helper to save order of multiple rows
export function useReorderDreLinhas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items) => {
      // Supabase doesn't have a bulk update by ID easily from JS client unless we loop or write an RPC.
      // We will loop since it's a small number of rows.
      const updates = items.map(item => supabase.from(TABLE).update({ ordem: item.ordem }).eq('id', item.id));
      await Promise.all(updates);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}
