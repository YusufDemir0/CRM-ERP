/**
 * Translates technical log terms into user-friendly human language.
 */

const MODULE_MAP: Record<string, string> = {
  'parties': 'Cari Hesap',
  'items': 'Ürün/Stok',
  'sales': 'Satış İşlemi',
  'staff': 'Personel',
  'users': 'Kullanıcı',
  'roles': 'Yetkilendirme',
  'departments': 'Departman',
  'accounts': 'Finansal Hesap',
  'transactions': 'Hesap Hareketi',
  'boms': 'Ürün Reçetesi',
  'production': 'Üretim Emri',
  'auth': 'Oturum İşlemi',
  'settings': 'Sistem Ayarları',
  'logs': 'Sistem Kayıtları',
  'notes': 'Notlar'
};

const ACTION_MAP: Record<string, string> = {
  'POST': 'Ekleme',
  'PUT': 'Güncelleme',
  'PATCH': 'Kısmi Güncelleme',
  'DELETE': 'Silme',
  'GET': 'Görüntüleme',
  'LOGIN': 'Giriş Yapıldı',
  'LOGOUT': 'Çıkış Yapıldı',
  'ERROR': 'Hata Oluştu',
  'SUCCESS': 'Başarıyla Tamamlandı',
  'TOGGLE_STATE': 'Durum Değişikliği',
  'APPROVE': 'Onaylama',
  'CANCEL': 'İptal Etme'
};

export const translateLog = (log: { module: string; action: string; details?: string; tag?: string }) => {
  const moduleName = MODULE_MAP[log.module.toLowerCase()] || log.module;
  
  // Handle technical action strings (like "parties PUT error")
  let actionText = log.action;
  const upperAction = log.action.toUpperCase();

  if (upperAction.includes('POST')) actionText = 'Yeni Kayıt Eklendi';
  else if (upperAction.includes('PUT') || upperAction.includes('PATCH')) actionText = 'Bilgiler Güncellendi';
  else if (upperAction.includes('DELETE')) actionText = 'Kayıt Silindi';
  else if (ACTION_MAP[upperAction]) actionText = ACTION_MAP[upperAction];

  // Specific mapping for common patterns
  if (log.tag === 'ERROR') {
    return {
      title: `${moduleName} İşlem Hatası`,
      message: `${moduleName} üzerinde işlem yapılırken bir sorunla karşılaşıldı.`
    };
  }

  return {
    title: `${moduleName}: ${actionText}`,
    message: log.details || 'İşlem detayları belirtilmemiş.'
  };
};
