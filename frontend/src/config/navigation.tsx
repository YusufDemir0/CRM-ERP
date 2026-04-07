import React from 'react';
import {
  FiHome, FiUsers, FiShield, FiLayers, FiUserCheck,
  FiPackage, FiBox, FiShoppingCart, FiDollarSign,
  FiCreditCard, FiRepeat, FiSettings, FiTool
} from 'react-icons/fi';

export interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  keywords?: string[];
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export const navItems: NavSection[] = [
  { section: 'Genel', items: [
    { to: '/', icon: <FiHome />, label: 'Dashboard', keywords: ['ana sayfa', 'dashboard', 'panel'] },
  ]},
  { section: 'Yönetim', items: [
    { to: '/users', icon: <FiUsers />, label: 'Kullanıcılar', keywords: ['kullanıcı', 'user', 'personel'] },
    { to: '/roles', icon: <FiShield />, label: 'Roller & Yetkiler', keywords: ['rol', 'yetki', 'permission'] },
    { to: '/departments', icon: <FiLayers />, label: 'Departmanlar', keywords: ['departman', 'birim', 'department'] },
  ]},
  { section: 'CRM', items: [
    { to: '/parties', icon: <FiUserCheck />, label: 'Cari Hesaplar', keywords: ['cari', 'müşteri', 'tedarikçi'] },
  ]},
  { section: 'Stok', items: [
    { to: '/items', icon: <FiPackage />, label: 'Ürünler', keywords: ['ürün', 'item', 'malzeme'] },
    { to: '/stocks', icon: <FiBox />, label: 'Stok Durumu', keywords: ['stok', 'envanter', 'depo'] },
  ]},
  { section: 'Satış', items: [
    { to: '/sales', icon: <FiShoppingCart />, label: 'Siparişler', keywords: ['satış', 'sipariş', 'order'] },
  ]},
  { section: 'Finans', items: [
    { to: '/currencies', icon: <FiDollarSign />, label: 'Para Birimleri', keywords: ['kur', 'döviz', 'currency'] },
    { to: '/accounts', icon: <FiCreditCard />, label: 'Hesaplar', keywords: ['kasa', 'banka', 'hesap'] },
    { to: '/transactions', icon: <FiRepeat />, label: 'İşlemler', keywords: ['işlem', 'hareket', 'transfer'] },
  ]},
  { section: 'Üretim', items: [
    { to: '/boms', icon: <FiBox />, label: 'Ürün Reçeteleri', keywords: ['reçete', 'bom', 'üretim'] },
    { to: '/production', icon: <FiTool />, label: 'Üretim Emirleri', keywords: ['emir', 'üretim', 'iş emri'] },
  ]},
  { section: 'Sistem', items: [
    { to: '/settings', icon: <FiSettings />, label: 'Ayarlar', keywords: ['ayar', 'sistem', 'config'] },
  ]},
];

export const getAllNavItems = () => navItems.flatMap(section => section.items);
