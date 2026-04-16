"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsrfInterceptor = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let CsrfInterceptor = class CsrfInterceptor {
    intercept(context, next) {
        const response = context.switchToHttp().getResponse();
        const request = context.switchToHttp().getRequest();
        let token = request.cookies['XSRF-TOKEN'];
        if (!token) {
            token = (0, uuid_1.v4)();
            response.cookie('XSRF-TOKEN', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
            });
        }
        response.setHeader('X-CSRF-TOKEN', token);
        return next.handle();
    }
};
exports.CsrfInterceptor = CsrfInterceptor;
exports.CsrfInterceptor = CsrfInterceptor = __decorate([
    (0, common_1.Injectable)()
], CsrfInterceptor);
//# sourceMappingURL=csrf.interceptor.js.map