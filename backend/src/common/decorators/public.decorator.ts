import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() decorator — bu decorator'ı kullanan endpoint'ler JWT doğrulaması gerektirmez.
 * Kullanım: @Public() login, register gibi endpoint'lerde
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
