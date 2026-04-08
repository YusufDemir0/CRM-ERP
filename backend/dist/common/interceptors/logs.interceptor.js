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
let LogsInterceptor = LogsInterceptor_1 = class LogsInterceptor {
    constructor(logsService) {
        this.logsService = logsService;
        this.logger = new common_1.Logger(LogsInterceptor_1.name);
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;
        const loggableMethods = ['POST', 'PUT', 'DELETE'];
        if (!loggableMethods.includes(method)) {
            return next.handle();
        }
        if (url.includes('/logs') || url.includes('/auth/login')) {
            return next.handle();
        }
        return next.handle().pipe((0, operators_1.tap)((data) => {
            this.saveLog(request, 'SUCCESS', data).catch(err => this.logger.error(`Audit log failed: ${err.message}`));
        }), (0, operators_1.catchError)((err) => {
            this.saveLog(request, 'ERROR', err).catch(e => this.logger.error(`Audit error-log failed: ${e.message}`));
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
    async saveLog(request, status, responseData) {
        try {
            const { method, url, user, ip, body } = request;
            const userId = user?.id || user?.sub || null;
            const username = user?.username || 'SYSTEM';
            const fullName = user?.fullName || user?.full_name || '';
            const parts = url.replace(/^\/api\//, '').split('/');
            const moduleName = (parts[0] || 'SYSTEM').toUpperCase();
            const action = `${method} ${url}`;
            const cleanBody = { ...body };
            const sensitiveFields = ['password', 'token', 'access_token', 'secret', 'passwordHash'];
            sensitiveFields.forEach(f => {
                if (cleanBody[f])
                    cleanBody[f] = '********';
            });
            let responseSummary = 'OK';
            if (status === 'ERROR') {
                responseSummary =
                    responseData?.message ||
                        responseData?.response?.message ||
                        String(responseData) ||
                        'REQUEST_FAILED';
            }
            await this.logsService.addLog({
                userId,
                username,
                fullName,
                action,
                module: moduleName,
                tag: status,
                details: JSON.stringify({
                    body: Object.keys(cleanBody).length > 0 ? cleanBody : null,
                    status,
                    response: responseSummary,
                }),
                ipAddress: ip,
            });
        }
        catch (e) {
            this.logger.error(`LogsInterceptor.saveLog crashed silently: ${e.message}`);
        }
    }
};
exports.LogsInterceptor = LogsInterceptor;
exports.LogsInterceptor = LogsInterceptor = LogsInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logs_service_1.LogsService])
], LogsInterceptor);
//# sourceMappingURL=logs.interceptor.js.map