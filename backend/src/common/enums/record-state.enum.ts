/**
 * ERP Sistemi Genel Kayıt Durumları
 */
export enum RecordState {
  /** Kayıt pasif, aramalarda çıkmaz, işlem yapılamaz */
  PASSIVE = 0,
  /** Kayıt aktif ve kullanılabilir */
  ACTIVE = 1,
  /** Kayıt kilitli, silinemez / değiştirilemez ancak raporlarda görünür */
  LOCKED = 2,
  /** Kayıt taslak aşamasında */
  DRAFT = 3,
  /** Kayıt arşive kaldırılmış */
  ARCHIVED = 4
}
