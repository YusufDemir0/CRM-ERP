"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LogsInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
const logs_service_1 = require("../../modules/logs/logs.service");
const nestjs_cls_1 = require("nestjs-cls");
let LogsInterceptor = LogsInterceptor_1 = class LogsInterceptor {
    constructor(logsService, cls) {
        this.logsService = logsService;
        this.cls = cls;
        this.logger = new common_1.Logger(LogsInterceptor_1.name);
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;
        const loggableMethods = ['POST', 'PUT', 'DELETE'];
        if (!loggableMethods.includes(method)) {
            return next.handle();
        }
        if (url.includes('/logs')) {
            return next.handle();
        }
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)((data) => {
            const duration = Date.now() - startTime;
            this.saveLog(request, 'SUCCESS', data, duration).catch(err => this.logger.error(`Audit log failed: ${err.message}`));
        }), (0, operators_1.catchError)((err) => {
            const duration = Date.now() - startTime;
            this.saveLog(request, 'ERROR', err, duration).catch(e => this.logger.error(`Audit error-log failed: ${e.message}`));
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
    sanitizeBody(body) {
        if (!body || typeof body !== 'object')
            return body;
        if (Array.isArray(body))
            return '[ARRAY_CONTENT_HIDDEN]';
        const sanitized = { ...body };
        const sensitiveKeys = ['password', 'token', 'secret', 'hash', 'iban', 'cc_', 'cvv', 'tax_number', 'tc_no'];
        for (const key of Object.keys(sanitized)) {
            if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
                sanitized[key] = '********';
            }
        }
        return sanitized;
    }
    async saveLog(request, status, responseData, durationMs) {
        try {
            const { method, url, user, ip, body } = request;
            const cleanBody = body ? this.sanitizeBody(body) : null;
            const reqId = this.cls.get('reqId') || request.id;
            let detailsBody = cleanBody;
            if (cleanBody) {
                const bodyStr = JSON.stringify(cleanBody);
                if (bodyStr.length > 5120)
                    detailsBody = '[PAYLOAD_TOO_LARGE]';
            }
            let responseMsg = 'OK';
            if (status === 'ERROR') {
                const errObj = responseData;
                responseMsg = errObj?.message || errObj?.response?.message || String(responseData);
                if (responseMsg.length > 1000)
                    responseMsg = responseMsg.substring(0, 1000) + '...';
            }
            await this.logsService.addLog({
                userId: Number(user?.id || user?.sub || 0),
                username: String(user?.username || 'SYSTEM'),
                fullName: String(user?.fullName || user?.full_name || ''),
                action: `${method} ${url}`,
                module: (url.replace(/^\/api\//, '').split('/')[0] || 'SYSTEM').toUpperCase(),
                tag: status,
                details: JSON.stringify({
                    reqId,
                    durationMs,
                    body: detailsBody,
                    status,
                    response: responseMsg,
                }),
                ipAddress: ip,
            });
        }
        catch (e) {
            this.logger.error(`Audit log failed: ${e.message}`);
        }
    }
};
exports.LogsInterceptor = LogsInterceptor;
exports.LogsInterceptor = LogsInterceptor = LogsInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logs_service_1.LogsService,
        nestjs_cls_1.ClsService])
], LogsInterceptor);
//# sourceMappingURL=logs.interceptor.js.map