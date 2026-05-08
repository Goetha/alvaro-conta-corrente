import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const TABLE = 'periodos_operacao';

/**
 * Lista todos os períodos de operação, com join para obter
 * as placas de cavalo e carreta e o nome da operação.
 */
export function usePeriodosOperacao() {
  return useQuery({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(`
          *,
          cavalo:cavalo_id ( id, placa ),
          carreta:carreta_id ( id, placa ),
          operacao:operacao_id ( id, nome )
        `)
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Busca o período ATIVO (data_fim = null) de um cavalo específico.
 */
export function usePeriodoAtivo(cavaloId) {
  return useQuery({
    queryKey: [TABLE, 'ativo', cavaloId],
    queryFn: async () => {
      if (!cavaloId) return null;
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('cavalo_id', cavaloId)
        .is('data_fim', null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!cavaloId,
  });
}

/**
 * Cria um novo período de operação.
 */
export function useCreatePeriodoOperacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}

/**
 * Fecha o período ativo de um cavalo preenchendo data_fim = hoje.
 */
export function useClosePeriodoOperacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ periodoId, dataFim }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ data_fim: dataFim })
        .eq('id', periodoId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}

/**
 * Função utilitária: calcula dias de um período.
 * Se data_fim for null, usa hoje.
 */
export function calcularDias(dataInicio, dataFim) {
  if (!dataInicio) return 0;
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = dataFim ? new Date(dataFim + 'T00:00:00') : new Date();
  const diff = fim - inicio;
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}
