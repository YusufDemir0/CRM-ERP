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
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const reqId = request.id || request.headers['x-request-id'] || 'unknown';
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let clientMessage = 'Beklenmedik bir sistem hatası oluştu. Lütfen tekrar deneyiniz.';
        let errorCode = 'INTERNAL_ERROR';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            clientMessage = typeof res === 'string' ? res : res.message || clientMessage;
            errorCode = `HTTP_${status}`;
        }
        else if (exception instanceof typeorm_1.QueryFailedError) {
            status = common_1.HttpStatus.UNPROCESSABLE_ENTITY;
            errorCode = exception.code || 'DB_ERROR';
            switch (errorCode) {
                case 'ER_DUP_ENTRY':
                case '1062':
                    clientMessage = 'Bu bilgi sistemde zaten mevcut. Lütfen benzersiz bir değer giriniz.';
                    status = common_1.HttpStatus.CONFLICT;
                    break;
                case 'ER_NO_REFERENCED_ROW_2':
                case '1452':
                    clientMessage = 'İlişkili veri bulunamadı. Lütfen referans verdiğiniz kayıtların doğruluğunu kontrol ediniz.';
                    break;
                case 'ER_ROW_IS_REFERENCED_2':
                case '1217':
                case '1451':
                    clientMessage = 'Bu kayıt başka veriler tarafından kullanıldığı için silinemez veya güncellenemez.';
                    break;
                default:
                    clientMessage = 'Veritabanı işlemi sırasında bir hata oluştu.';
            }
            this.logger.error(`[DB_ERROR] ${errorCode}: ${exception.message}`, exception.stack);
        }
        else {
            const msg = exception instanceof Error ? exception.message : 'Unknown';
            this.logger.error(`[CRITICAL_UNHANDLED] ${msg} | reqId=${reqId}`, exception instanceof Error ? exception.stack : '');
        }
        const isProd = process.env.NODE_ENV === 'production';
        response.status(status).json({
            success: false,
            statusCode: status,
            errorCode,
            reqId,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: clientMessage,
            ...(!isProd && { debug: exception instanceof Error ? exception.message : String(exception) }),
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map