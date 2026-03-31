import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Controller/handler'lara gerekli yetki key'lerini belirtmek için decorator.
 * Kullanım: @RequirePermissions('satis_olusturma', 'satis_onaylama')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
