import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Controller/handler'lara gerekli yetki key'lerini belirtmek için decorator.
 * Kullanım: @RequirePermissions('SALES_CREATE', 'SALES_APPROVE')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
