"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
        this.isProd = process.env.NODE_ENV === 'production';
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let clientMessage = 'Beklenmedik bir sistem hatası oluştu. Lütfen tekrar deneyiniz.';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            if (status < 500) {
                const res = exception.getResponse();
                clientMessage = typeof res === 'string' ? res : res.message || clientMessage;
            }
        }
        else if (exception instanceof typeorm_1.QueryFailedError) {
            status = common_1.HttpStatus.UNPROCESSABLE_ENTITY;
            clientMessage = 'Veri işleme hatası. Girdiğiniz bilgilerin benzersizliğini ve geçerliliğini kontrol ediniz.';
            this.logger.error('[DB_ERROR_MASKED]', exception.message, exception.stack);
        }
        else {
            const msg = exception instanceof Error ? exception.message : 'Unknown';
            this.logger.error('[CRITICAL_UNHANDLED]', msg, exception instanceof Error ? exception.stack : '');
        }
        response.status(status).json({
            success: false,
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: clientMessage,
            ...((!this.isProd) && { debug: exception instanceof Error ? exception.message : String(exception) }),
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map