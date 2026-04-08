import React from 'react';
import {
  FiHome, FiUsers, FiShield, FiLayers, FiUserCheck,
  FiPackage, FiBox, FiShoppingCart, FiDollarSign,
  FiCreditCard, FiRepeat, FiSettings, FiTool,
  FiFile, FiList
} from 'react-icons/fi';

export interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  keywords?: string[];
  permission?: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export const navItems: NavSection[] = [
  { section: 'Genel', items: [
    { to: '/', icon: <FiHome />, label: 'Dashboard', keywords: ['ana sayfa', 'dashboard', 'panel'] },
    { to: '/notes', icon: <FiFile />, label: 'Kişisel Notlarım', keywords: ['not', 'kendi', 'hatırlatıcı'] },
  ]},
  { section: 'Yönetim', items: [
    { to: '/users', icon: <FiUsers />, label: 'Kullanıcılar', keywords: ['kullanıcı', 'user', 'personel'], permission: 'users:view' },
    { to: '/roles', icon: <FiShield />, label: 'Roller & Yetkiler', keywords: ['rol', 'yetki', 'permission'], permission: 'roles:view' },
    { to: '/departments', icon: <FiLayers />, label: 'Departmanlar', keywords: ['departman', 'birim', 'department'], permission: 'departments:view' },
  ]},
  { section: 'CRM', items: [
    { to: '/parties', icon: <FiUserCheck />, label: 'Cari Hesaplar', keywords: ['cari', 'müşteri', 'tedarikçi'], permission: 'parties:view' },
  ]},
  { section: 'Stok', items: [
    { to: '/items', icon: <FiPackage />, label: 'Ürünler', keywords: ['ürün', 'item', 'malzeme'], permission: 'items:view' },
    { to: '/stocks', icon: <FiBox />, label: 'Stok Durumu', keywords: ['stok', 'envanter', 'depo'], permission: 'stocks:view' },
  ]},
  { section: 'Satış', items: [
    { to: '/sales', icon: <FiShoppingCart />, label: 'Siparişler', keywords: ['satış', 'sipariş', 'order'], permission: 'sales:view' },
  ]},
  { section: 'Finans', items: [
    { to: '/accounts', icon: <FiCreditCard />, label: 'Hesaplar', keywords: ['kasa', 'banka', 'hesap'], permission: 'accounts:view' },
    { to: '/transactions', icon: <FiRepeat />, label: 'İşlemler', keywords: ['işlem', 'hareket', 'transfer'], permission: 'transactions:view' },
  ]},
  { section: 'Üretim', items: [
    { to: '/boms', icon: <FiBox />, label: 'Ürün Reçeteleri', keywords: ['reçete', 'bom', 'üretim'], permission: 'boms:view' },
    { to: '/production', icon: <FiTool />, label: 'Üretim Emirleri', keywords: ['emir', 'üretim', 'iş emri'], permission: 'production:view' },
  ]},
  { section: 'Sistem', items: [
    { to: '/settings', icon: <FiSettings />, label: 'Ayarlar', keywords: ['ayar', 'sistem', 'config'], permission: 'settings:manage' },
    { to: '/logs', icon: <FiList />, label: 'Sistem Logları', keywords: ['log', 'işlem', 'denetim'], permission: 'system:manage' },
  ]},
];

export const getAllNavItems = () => navItems.flatMap(section => section.items);
