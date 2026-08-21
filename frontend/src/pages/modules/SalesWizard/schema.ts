import { z } from 'zod';

export const salesWizardSchema = z.object({
  customerId: z.string().min(1, "Müşteri zorunludur"),
  staffId: z.string().min(1, "Personel zorunludur"),
  paymentAccountId: z.string().min(1, "Kasa seçimi zorunludur"),
  phone: z.string().min(1, "Telefon 1 zorunludur"),
  phone2: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal('')),
  taxId: z.string().optional(),
  cityId: z.string().min(1, "Şehir seçimi zorunludur"),
  district: z.string().min(1, "İlçe seçimi zorunludur"),
  address: z.string().optional(),
  date: z.string().min(1, "Satış tarihi zorununlu"),
  deliveryDate: z.string().min(1, "Teslimat tarihi zorunludur").refine((val) => {
    const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
    return val >= todayStr;
  }, {
    message: "Teslimat tarihi bugünden önceki bir tarih olamaz"
  }),
  deposit: z.preprocess(
    (val): any => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number({
      message: "Lütfen kapora giriniz"
    }).min(0, "Lütfen kapora giriniz")
  ) as z.ZodType<number, any, any>,
  discountAmount: z.number().min(0),
  source: z.string().optional(),
  isTaxed: z.boolean(),
  isInvoiced: z.preprocess(
    (val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    },
    z.boolean({
      message: "Fatura kategorisi seçilmelidir"
    })
  ) as z.ZodType<boolean, any, any>,
  representativePrice: z.string(),
  description: z.string().optional(),
  maturityDays: z.number().min(0),
  paymentType: z.enum(['NAKİT', 'VADELİ']),
  installments: z.number().min(1),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().min(0.01, "Miktar 0'dan büyük olmalı"),
    unitPrice: z.number().min(0, "Birim fiyat 0'dan küçük olamaz"),
    taxRate: z.number().min(0)
  })).min(1, "En az bir ürün eklemelisiniz")
}).refine(data => {
  const deposit = data.deposit || 0;
  if (deposit === 0) return true;

  let maxAllowed = 0;
  if (data.representativePrice && data.representativePrice !== '') {
    maxAllowed = Number(data.representativePrice) || 0;
  } else if (data.items && data.items.length > 0) {
    maxAllowed = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  return maxAllowed > 0 ? deposit <= maxAllowed : true;
}, {
  message: "Kapora tutarı, anlaşılan toplam satış tutarından büyük olamaz",
  path: ["deposit"]
});

export type SalesWizardFormData = z.infer<typeof salesWizardSchema>;
