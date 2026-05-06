import { z } from 'zod';

export const salesWizardSchema = z.object({
  customerId: z.union([z.string(), z.number()]),
  staffId: z.union([z.string(), z.number()]),
  paymentAccountId: z.union([z.string(), z.number()]).nullable(),
  phone: z.string().min(1, "Telefon 1 zorunludur"),
  phone2: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal('')),
  taxId: z.string().optional(),
  cityId: z.union([z.string(), z.number()]),
  district: z.string().min(1, "İlçe seçimi zorunludur"),
  address: z.string().optional(),
  date: z.string().min(1, "Satış tarihi zorunludur"),
  deliveryDate: z.string().min(1, "Teslimat tarihi zorunludur"),
  deposit: z.number().min(0, "Kapora 0'dan küçük olamaz"),
  discountAmount: z.number().min(0),
  source: z.string().optional(),
  isTaxed: z.boolean().default(true),
  description: z.string().optional(),
  items: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    quantity: z.number().min(0.01, "Miktar 0'dan büyük olmalı"),
    unitPrice: z.number().min(0, "Birim fiyat 0'dan küçük olamaz"),
    taxRate: z.number().min(0)
  })).min(1, "En az bir ürün eklemelisiniz")
});

export type SalesWizardFormData = z.infer<typeof salesWizardSchema>;
