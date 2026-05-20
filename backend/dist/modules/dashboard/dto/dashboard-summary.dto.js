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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardSummaryDto = exports.DashboardStatsDto = exports.RecentActionDto = void 0;
const class_transformer_1 = require("class-transformer");
class RecentActionDto {
}
exports.RecentActionDto = RecentActionDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RecentActionDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RecentActionDto.prototype, "code", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RecentActionDto.prototype, "type", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], RecentActionDto.prototype, "amount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RecentActionDto.prototype, "date", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RecentActionDto.prototype, "partyName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RecentActionDto.prototype, "referenceType", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RecentActionDto.prototype, "description", void 0);
class DashboardStatsDto {
}
exports.DashboardStatsDto = DashboardStatsDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "revenue", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "count", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "profit", void 0);
class DashboardSummaryDto {
}
exports.DashboardSummaryDto = DashboardSummaryDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "totalCustomers", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "totalSalesCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "todaySales", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => DashboardStatsDto),
    __metadata("design:type", DashboardStatsDto)
], DashboardSummaryDto.prototype, "thisMonth", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => DashboardStatsDto),
    __metadata("design:type", DashboardStatsDto)
], DashboardSummaryDto.prototype, "lastMonth", void 0);
//# sourceMappingURL=dashboard-summary.dto.js.map