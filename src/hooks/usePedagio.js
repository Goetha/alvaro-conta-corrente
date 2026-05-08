import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const TABLE = 'contas_pagar_pedagio';

export function usePedagio(filters = {}) {
  return useQuery({
    queryKey: [TABLE, filters],
    queryFn: async () => {
      let allData = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        let query = supabase
          .from(TABLE)
          .select('*')
          .order('data', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (filters.search) {
          query = query.or(
            `historico.ilike.%${filters.search}%,parceiro.ilike.%${filters.search}%,placa.ilike.%${filters.search}%`
          );
        }
        if (filters.dataInicio) query = query.gte('data', filters.dataInicio);
        if (filters.dataFim) query = query.lte('data', filters.dataFim);

        const { data, error } = await query;
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('relation "contas_pagar_pedagio" does not exist')) {
            return [];
          }
          throw error;
        }
        
        if (data && data.length > 0) {
          allData = allData.concat(data);
        }

        if (!data || data.length < pageSize) {
          break;
        }
        page++;
      }

      return allData;
    },
  });
}

export function useCreatePedagio() {
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

export function useUpdatePedagio() {
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

export function useDeletePedagio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}
