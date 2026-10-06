import {
  IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsEmail, IsIn, IsNumber, IsInt,
  Min, Max, MaxLength, Matches, ArrayMinSize, ArrayMaxSize, IsPositive, IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

// Uzunluklar ERP kolonlarıyla aynı (parties.email 100, sales.address_city/district 50, items.image 255).
/** Yalnız rakam, isteğe bağlı baştaki + (ErmayWeb +90XXXXXXXXXX gönderir). */
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

/** ERP'de karşılığı olmayan web ürünlerinin bağlandığı deneme ürünler (ERP kodu `DNM-<değer>`). */
export const WEB_PLACEHOLDERS = ['MOBILYA', 'TAKIM', 'KOLTUK', 'MASA'] as const;
export type WebPlaceholder = (typeof WEB_PLACEHOLDERS)[number];

/** Her satırda ya `itemId` (gerçek ERP ürünü) ya da `placeholder` (deneme ürün) bulunur; servis ikisinden tam birini şart koşar. */
export class WebOrderItemDto {
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{1,18}$/, { message: 'itemId sayısal ERP ürün ID olmalıdır.' })
  itemId?: string;

  @IsOptional()
  @IsIn(WEB_PLACEHOLDERS)
  placeholder?: WebPlaceholder;

  @IsInt()
  @Min(1)
  @Max(10000)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(100_000_000)
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}

export class WebOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  warehouse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  warehouseCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  webOrderNumber?: string;

  @IsString()
  @IsIn(['INDIVIDUAL', 'CORPORATE'])
  customerType: 'INDIVIDUAL' | 'CORPORATE';

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @IsString()
  @Matches(PHONE_PATTERN)
  phone1: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN)
  phone2?: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  district: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxOffice?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,11}$/)
  taxNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  orderNote?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => WebOrderItemDto)
  items: WebOrderItemDto[];
}

export class UpdateItemImageDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  @MaxLength(255)
  imageUrl: string;
}
