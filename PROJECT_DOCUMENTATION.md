# Ermay CRM ERP - Proje Dokümantasyonu

## Proje Özeti
Ermay CRM ERP; CRM, stok yönetimi, üretim takibi, satış ve finans hesaplarını yönetmek için tasarlanmış kapsamlı bir kurumsal yönetim sistemidir.

## Teknoloji Yığını

### Backend
- **Çekirdek**: NestJS (Node.js framework)
- **Veritabanı**: MariaDB / MySQL
- **ORM**: TypeORM
- **Güvenlik**: JWT Kimlik Doğrulama, Throttler (Hız Sınırlayıcı), Yetki Bazlı Erişim Kontrolü (RBAC).

### Frontend
- **Çekirdek**: React (TypeScript ile)
- **Derleme Aracı**: Vite
- **Yönlendirme**: React Router DOM (v6)
- **Durum Yönetimi**: React Context API
- **Stil**: Modern CSS Değişkenleri (Theming desteği ile) ve `react-hot-toast` bildirim kütüphanesi.

---

## Proje Yapısı

```text
ermaycrmerp/
├── backend/                # NestJS Backend Uygulaması
│   ├── src/
│   │   ├── common/         # Ortak guard, interceptor, entity ve DTO'lar
│   │   ├── config/         # Veritabanı ve JWT yapılandırmaları
│   │   ├── modules/        # Özellik modülleri (Auth, Users, Parties, Inventory, vb.)
│   └── sql_dump.md         # Veritabanı şeması ve dump dosyası
├── frontend/               # React Frontend Uygulaması
│   ├── src/
│   │   ├── components/     # Ortak UI bileşenleri
│   │   ├── context/        # Global state yönetimi (Auth, Ayarlar)
│   │   ├── pages/          # Sayfa bileşenleri
│   │   ├── services/       # API servisleri
│   │   └── types/          # TypeScript arayüz tanımları
└── PROJECT_DOCUMENTATION.md # Bu dosya
```

---

## Temel İş Süreçleri

### 1. Cari (Parties) Yönetimi
Müşteri ve Tedarikçi yönetimi. Bakiye takibi, kredi limiti yönetimi ve vergi bilgileri bu modülde yer alır.
- **Güncelleme**: `credit_limit_plus` ve `credit_limit_minus` alanları tek bir `credit_limit` alanında birleştirilmiştir.

### 2. Stok (Inventory) Yönetimi
Hammadde, Yarı Mamül ve Mamül yönetimi. Kritik stok limitleri ve otomatik kod üretimi desteklenir.

### 3. Üretim Süreci
- **BOM (Reçete)**: Ürün içeriklerinin tanımlanması.
- **Üretim Emirleri**: Taslaktan tamamlanana kadar üretim aşamalarının takibi.

### 4. Satış ve Finans
- **Satış Sihirbazı**: Adım adım satış oluşturma süreci.
- **Hesaplar**: Banka ve Kasa yönetimi.
- **İşlemler**: Finans hareketlerinin kaydı.

---

## Geliştirme Akışı

1. **SQL Analizi**: Değişiklikler önce `sql_dump.md` üzerinde planlanır.
2. **Backend Güncelleme**: Entity, DTO ve Service katmanları güncellenir.
3. **Frontend Güncelleme**: Tip tanımları (Types) ve UI bileşenleri (Pages/Components) güncellenir.
4. **Doğrulama**: Tüm katmanların birbiriyle uyumlu çalıştığı test edilir.
