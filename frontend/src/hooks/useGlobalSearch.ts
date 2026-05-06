import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { itemsAPI, partiesAPI, salesAPI } from '../services/api';
import { Item, Party, Sale } from '../types';
import { getAllNavItems, NavItem } from '../config/navigation';

export interface GlobalSearchData {
  items: Item[];
  parties: Party[];
  sales: Sale[];
}

export const useGlobalSearch = (query: string) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GlobalSearchData>({
    items: [],
    parties: [],
    sales: [],
  });

  const debouncedQuery = useDebounce(query, 300);

  const allNavItems = getAllNavItems();
  
  const filteredNavItems: NavItem[] = query.trim() === '' 
    ? [] 
    : allNavItems.filter(item => 
        item.label.toLowerCase().includes(query.toLowerCase()) || 
        item.keywords?.some(k => k.toLowerCase().includes(query.toLowerCase()))
      );

  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setSearchResults({ items: [], parties: [], sales: [] });
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const [itemsRes, partiesRes, salesRes] = await Promise.all([
          itemsAPI.getAll({ search: debouncedQuery, limit: 5 }),
          partiesAPI.getAll({ search: debouncedQuery, limit: 5 }),
          salesAPI.getAll({ search: debouncedQuery, limit: 5 })
        ]);
        setSearchResults({
          items: itemsRes.data.data,
          parties: partiesRes.data.data,
          sales: salesRes.data.data
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  return {
    isSearching,
    searchResults,
    filteredNavItems,
  };
};
