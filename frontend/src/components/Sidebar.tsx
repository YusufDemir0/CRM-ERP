import { NavLink } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { navItems } from '../config/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { partiesAPI, stocksAPI, itemsAPI, salesAPI, accountsAPI, transactionsAPI, bomsAPI, productionOrdersAPI } from '../services/api';
import { queryKeys } from '../services/queryKeys';
import logo from '../assets/images/logo.png';
import { memo } from 'react';

export const Sidebar = memo(({ isCollapsed, isMobileOpen, onClose }: { isCollapsed: boolean; isMobileOpen?: boolean; onClose?: () => void }) => {
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
    <aside className={`sidebar ${isCollapsed && !isMobileOpen ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo flex items-center justify-between py-6 px-4">
        {isCollapsed ? (
          <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary-glow)] p-1.5">
            <img src={logo} alt="E" className="w-full h-full object-contain brightness-0 invert" />
          </div>
        ) : (
          <div className="flex flex-col items-center flex-1">
            <div className="w-24 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary-glow)] p-2 mb-2">
              <img src={logo} alt="Ermay ERP" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-60">Enterprise System</span>
          </div>
        )}
        
        {/* Mobile Close Button */}
        {isMobileOpen && (
          <button 
            className="lg:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {filteredNavItems.map((section) => (
          <div className="nav-section" key={section.section}>
            {(isMobileOpen || !isCollapsed) && <div className="nav-section-title">{section.section}</div>}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/stocks'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onMouseEnter={() => handlePrefetch(item.to)}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {(isMobileOpen || !isCollapsed) && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

    </aside>
  );
});

export default Sidebar;
