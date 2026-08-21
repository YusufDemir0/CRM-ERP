
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
    { to: '/notes', icon: <FiFile />, label: 'Notlar', keywords: ['not', 'kendi', 'hatırlatıcı'] },
  ]},
  { section: 'Sevk/Depo', items: [
    { to: '/mastersale', icon: <FiShoppingCart />, label: 'Yetkili Satışlar', keywords: ['master', 'satış', 'onay', 'sipariş'], permission: 'SALES_VIEW_ALL' },
    { to: '/shipments', icon: <FiPackage />, label: 'Sevkiyatlar', keywords: ['sevkiyat', 'shipment', 'teslimat'], permission: 'SHIPMENT_VIEW' },
  ]},
  { section: 'Satışlar', items: [
    { to: '/sales', icon: <FiShoppingCart />, label: 'Satışlar', keywords: ['satış', 'sipariş', 'order'], permission: 'SALES_PAGE' },
  ]},
  { section: 'Hesaplar', items: [
    { to: '/accounts', icon: <FiCreditCard />, label: 'Hesaplar', keywords: ['kasa', 'banka', 'hesap'], permission: 'FINANCE_PAGE' },
    { to: '/transactions', icon: <FiRepeat />, label: 'Hesap Hareketleri', keywords: ['işlem', 'hareket', 'transfer'], permission: 'FINANCE_PAGE' },
  ]},
  { section: 'Müşteriler', items: [
    { to: '/parties', icon: <FiUserCheck />, label: 'Müşteriler', keywords: ['cari', 'müşteri', 'tedarikçi'], permission: 'PARTIES_PAGE' },
    { to: '/parties/movements', icon: <FiUserCheck />, label: 'Müşteri Hareketleri', keywords: ['cari', 'hareket', 'müşteri'], permission: 'PARTIES_PAGE' },
  ]},
  { section: 'Stok', items: [
    { to: '/stocks', icon: <FiBox />, label: 'Stok', keywords: ['stok', 'envanter', 'depo'], permission: 'INVENTORY_PAGE' },
    { to: '/stocks/movements', icon: <FiRepeat />, label: 'Stok Hareketleri', keywords: ['stok', 'hareket', 'transfer'], permission: 'INVENTORY_PAGE' },
  ]},
  { section: 'Ürünler', items: [
    { to: '/items', icon: <FiPackage />, label: 'Ürünler', keywords: ['ürün', 'item', 'malzeme'], permission: 'INVENTORY_PAGE' },
    { to: '/production', icon: <FiTool />, label: 'Üretim Emirleri', keywords: ['emir', 'üretim', 'iş emri'], permission: 'PRODUCTION_PAGE' },
    { to: '/boms', icon: <FiBox />, label: 'Ürün Reçeteleri', keywords: ['reçete', 'bom', 'üretim'], permission: 'PRODUCTION_PAGE' },
  ]},
  { section: 'Yönetim', items: [
    { to: '/users', icon: <FiUsers />, label: 'Kullanıcı', keywords: ['kullanıcı', 'user', 'personel'], permission: 'USERS_PAGE' },
    { to: '/roles', icon: <FiShield />, label: 'Roller', keywords: ['rol', 'yetki', 'permission'], permission: 'ROLES_PAGE' },
    { to: '/departments', icon: <FiLayers />, label: 'Departmanlar', keywords: ['departman', 'birim', 'department'], permission: 'DEPARTMENTS_PAGE' },
    { to: '/personnel/units', icon: <FiUsers />, label: 'Personel Birimler', keywords: ['personel', 'birim', 'staff', 'unit'], permission: 'DEPARTMENTS_PAGE' },
  ]},
  { section: 'Sistem', items: [
    { to: '/settings', icon: <FiSettings />, label: 'Ayarlar', keywords: ['ayar', 'sistem', 'config'], permission: 'SYSTEM_PAGE' },
    { to: '/logs', icon: <FiList />, label: 'Loglar', keywords: ['log', 'işlem', 'denetim'], permission: 'SYSTEM_VIEW_LOGS' },
  ]},
];

export const getAllNavItems = () => navItems.flatMap(section => section.items);
