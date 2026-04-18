
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
    { to: '/users', icon: <FiUsers />, label: 'Kullanıcılar', keywords: ['kullanıcı', 'user', 'personel'], permission: 'kullanici_goruntuleme' },
    { to: '/roles', icon: <FiShield />, label: 'Roller & Yetkiler', keywords: ['rol', 'yetki', 'permission'], permission: 'rol_goruntuleme' },
    { to: '/departments', icon: <FiLayers />, label: 'Departmanlar', keywords: ['departman', 'birim', 'department'], permission: 'system:manage' },
  ]},
  { section: 'CRM', items: [
    { to: '/parties', icon: <FiUserCheck />, label: 'Cari Hesaplar', keywords: ['cari', 'müşteri', 'tedarikçi'], permission: 'musteri_goruntuleme' },
  ]},
  { section: 'Stok', items: [
    { to: '/items', icon: <FiPackage />, label: 'Ürünler', keywords: ['ürün', 'item', 'malzeme'], permission: 'stok_goruntuleme' },
    { to: '/stocks', icon: <FiBox />, label: 'Stok Durumu', keywords: ['stok', 'envanter', 'depo'], permission: 'stok_goruntuleme' },
  ]},
  { section: 'Satış', items: [
    { to: '/sales', icon: <FiShoppingCart />, label: 'Siparişler', keywords: ['satış', 'sipariş', 'order'], permission: 'satis_goruntuleme' },
  ]},
  { section: 'Finans', items: [
    { to: '/accounts', icon: <FiCreditCard />, label: 'Hesaplar', keywords: ['kasa', 'banka', 'hesap'], permission: 'finans_goruntuleme' },
    { to: '/transactions', icon: <FiRepeat />, label: 'İşlemler', keywords: ['işlem', 'hareket', 'transfer'], permission: 'finans_goruntuleme' },
  ]},
  { section: 'Üretim', items: [
    { to: '/boms', icon: <FiBox />, label: 'Ürün Reçeteleri', keywords: ['reçete', 'bom', 'üretim'], permission: 'uretim_goruntuleme' },
    { to: '/production', icon: <FiTool />, label: 'Üretim Emirleri', keywords: ['emir', 'üretim', 'iş emri'], permission: 'uretim_goruntuleme' },
  ]},
  { section: 'Sistem', items: [
    { to: '/settings', icon: <FiSettings />, label: 'Ayarlar', keywords: ['ayar', 'sistem', 'config'], permission: 'system:manage' },
    { to: '/logs', icon: <FiList />, label: 'Sistem Logları', keywords: ['log', 'işlem', 'denetim'], permission: 'system:manage' },
  ]},
];

export const getAllNavItems = () => navItems.flatMap(section => section.items);
