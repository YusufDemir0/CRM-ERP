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
    async emitSync(type, payload, metadata) {
        this.logger.debug(`Event emitted (Sync): ${type}`);
        this.bus$.next({ type, payload, metadata });
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers && typeHandlers.length > 0) {
            await Promise.all(typeHandlers.map(handler => handler(payload)));
        }
    }
    subscribeSync(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type).push(handler);
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