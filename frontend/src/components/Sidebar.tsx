import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { navItems } from '../config/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { partiesAPI, stocksAPI, itemsAPI, salesAPI, accountsAPI, transactionsAPI, bomsAPI, productionOrdersAPI } from '../services/api';
import { queryKeys } from '../services/queryKeys';
import logo from '../assets/images/logo.png';

export default function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const handlePrefetch = (to: string) => {
    // Intent-to-Fetch: Prefetch data based on navigation target
    if (to === '/parties') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.parties.all({ page: 1, limit: 20 }),
        queryFn: () => partiesAPI.getAll({ page: 1, limit: 20 })
      });
    } else if (to === '/stocks') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.stocks.all({ page: 1, limit: 20 }),
        queryFn: () => stocksAPI.getAll({ page: 1, limit: 20 })
      });
    } else if (to === '/items') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.items.all({ page: 1, limit: 20 }),
        queryFn: () => itemsAPI.getAll({ page: 1, limit: 20 })
      });
    } else if (to === '/sales') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.sales.all({ page: 1, limit: 20 }),
        queryFn: () => salesAPI.getAll({ page: 1, limit: 20 })
      });
    } else if (to === '/accounts') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.accounts.all({ page: 1, limit: 20 }),
        queryFn: () => accountsAPI.getAll({ page: 1, limit: 20 })
      });
    } else if (to === '/transactions') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.transactions.all({ page: 1, limit: 20 }),
        queryFn: () => transactionsAPI.getAll({ page: 1, limit: 20 })
      });
    } else if (to === '/boms') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.boms.all({ page: 1, limit: 20 }),
        queryFn: () => bomsAPI.getAll({ page: 1, limit: 20 })
      });
    } else if (to === '/production') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.productionOrders.all({ page: 1, limit: 20 }),
        queryFn: () => productionOrdersAPI.getAll({ page: 1, limit: 20 })
      });
    }
  };



  // Filter items within sections
  const filteredNavItems = navItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.permission) {
        return hasPermission(item.permission);
      }
      return true;
    })
  })).filter(section => section.items.length > 0);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo flex items-center justify-center py-6 px-4">
        {isCollapsed ? (
          <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary-glow)] p-1.5">
            <img src={logo} alt="E" className="w-full h-full object-contain brightness-0 invert" />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-28 h-14 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary-glow)] p-2 mb-3">
              <img src={logo} alt="Ermay ERP" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-60">Enterprise System</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {filteredNavItems.map((section) => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onMouseEnter={() => handlePrefetch(item.to)}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

    </aside>
  );
}
