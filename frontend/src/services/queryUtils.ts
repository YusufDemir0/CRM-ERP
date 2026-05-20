import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * Global Invalidation Matrix
 * 
 * Bu dosya, sistemin belli noktalarinda (orn: satis, stok hareketi) hangi cache'lerin
 * dusurulmesi (invalidate) gerektigini gosteren merkezi mantigi icerir.
 * 
 * STRATEGY:
 *   - Critical data (directly affected): invalidate immediately → triggers refetch
 *   - Secondary data (indirectly affected): mark stale only → refetch when user navigates
 *     Uses refetchType: 'none' to prevent background network storms
 */

export const invalidateAfterSale = (queryClient: QueryClient) => {
  // Critical: Directly affected by sale — refetch immediately
  queryClient.invalidateQueries({ queryKey: ['sales'] });
  queryClient.invalidateQueries({ queryKey: ['stocks'] });
  
  // Secondary: Mark stale only — user will see fresh data when they navigate there
  queryClient.invalidateQueries({ queryKey: ['parties'], refetchType: 'none' });   // Cari bakiye değişir
  queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'none' }); // İstatistikler
  queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' }); // Cari işlem
};

export const invalidateAfterStockMovement = (queryClient: QueryClient) => {
  // Critical
  queryClient.invalidateQueries({ queryKey: ['stocks'] });
  // Secondary
  queryClient.invalidateQueries({ queryKey: ['items'], refetchType: 'none' });
  queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'none' });
};

export const invalidateAfterPartyUpdate = (queryClient: QueryClient) => {
  // Critical
  queryClient.invalidateQueries({ queryKey: ['parties'] });
  // Secondary
  queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'none' });
  queryClient.invalidateQueries({ queryKey: ['sales'], refetchType: 'none' });
};
