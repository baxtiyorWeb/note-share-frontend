import { useQuery, UseQueryResult } from '@tanstack/react-query';
import api from '@/config/api';

interface DashboardStats {
  totalNotes: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}
export const useDashboardStats = (): UseQueryResult<DashboardStats, Error> => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};