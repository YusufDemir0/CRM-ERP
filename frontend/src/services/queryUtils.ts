import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * Global Invalidation Matrix
 * 
 * Bu dosya, sistemin belli noktalarinda (orn: satis, stok hareketi) hangi cache'lerin
 * dusurulmesi (invalidate) gerektigini gosteren merkezi mantigi icerir.
 */

export const invalidateAfterSale = (queryClient: QueryClient) => {
  // Satış yapıldığında etkilenecek tüm entity'ler uçurulur
  queryClient.invalidateQueries({ queryKey: ['sales'] });
  queryClient.invalidateQueries({ queryKey: ['stocks'] });
  queryClient.invalidateQueries({ queryKey: ['parties'] }); // Cari bakiye değişir
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Cari işlem eklenebilir
};

export const invalidateAfterStockMovement = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['stocks'] });
  queryClient.invalidateQueries({ queryKey: ['items'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

export const invalidateAfterPartyUpdate = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['parties'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['sales'] });
};
