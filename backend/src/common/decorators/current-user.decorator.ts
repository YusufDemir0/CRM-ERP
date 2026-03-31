import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Controller'larda aktif kullanıcıyı almak için decorator.
 * Kullanım: @CurrentUser() user: JwtPayload
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
