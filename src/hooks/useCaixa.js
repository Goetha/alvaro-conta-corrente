import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const TABLE = 'caixa';

export function useCaixa(filters = {}) {
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
          .order('data', { ascending: true })
          .order('created_at', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (filters.conta) query = query.eq('conta', filters.conta);
        if (filters.parceiro) query = query.ilike('parceiro', `%${filters.parceiro}%`);
        if (filters.search) {
          query = query.or(
            `historico.ilike.%${filters.search}%,parceiro.ilike.%${filters.search}%,numero.ilike.%${filters.search}%`
          );
        }
        if (filters.dataInicio) query = query.gte('data', filters.dataInicio);
        if (filters.dataFim) query = query.lte('data', filters.dataFim);

        const { data, error } = await query;
        if (error) throw error;
        
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

export function useCreateCaixa() {
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

export function useUpdateCaixa() {
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

export function useDeleteCaixa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}
