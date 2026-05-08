import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useAppSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['app_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) {
        console.error("Error fetching app_settings", error);
        return {};
      }
      const settingsMap = {};
      data.forEach(item => {
        settingsMap[item.key] = item.value;
      });
      return settingsMap;
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const { data, error } = await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['app_settings'] });
      const previousSettings = queryClient.getQueryData(['app_settings']);
      queryClient.setQueryData(['app_settings'], old => ({
        ...old,
        [key]: value
      }));
      return { previousSettings };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['app_settings'], context.previousSettings);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['app_settings'] });
    }
  });

  return {
    settings: query.data || {},
    isLoading: query.isLoading,
    updateSetting: (key, value) => mutation.mutate({ key, value })
  };
}
