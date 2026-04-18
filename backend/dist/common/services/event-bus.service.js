"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var InternalEventBus_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalEventBus = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let InternalEventBus = InternalEventBus_1 = class InternalEventBus {
    constructor() {
        this.logger = new common_1.Logger(InternalEventBus_1.name);
        this.bus$ = new rxjs_1.Subject();
        this.handlers = new Map();
    }
    emit(type, payload, metadata) {
        this.logger.debug(`Event emitted (Async): ${type}`);
        this.bus$.next({ type, payload, metadata });
    }
    subscribeSync(type, handler) {
        const handlers = this.handlers.get(type) || [];
        handlers.push(handler);
        this.handlers.set(type, handlers);
    }
    async emitSync(type, payload, metadata) {
        this.logger.debug(`Event emitted (Sync): ${type}`);
        const handlers = this.handlers.get(type) || [];
        for (const handler of handlers) {
            await handler(payload);
        }
        this.bus$.next({ type, payload, metadata });
    }
    on(type) {
        return this.bus$.pipe((0, operators_1.filter)(event => event.type === type), (0, operators_1.map)(event => event.payload));
    }
    all() {
        return this.bus$.asObservable();
    }
};
exports.InternalEventBus = InternalEventBus;
exports.InternalEventBus = InternalEventBus = InternalEventBus_1 = __decorate([
    (0, common_1.Injectable)()
], InternalEventBus);
//# sourceMappingURL=event-bus.service.js.map