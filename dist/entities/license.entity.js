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
exports.License = void 0;
const base_entity_1 = require("./base.entity");
const typeorm_1 = require("typeorm");
let License = class License extends base_entity_1.BaseEntity {
};
exports.License = License;
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], License.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'nvarchar', length: 256 }),
    __metadata("design:type", String)
], License.prototype, "primaryName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'nvarchar', length: 256, nullable: true }),
    __metadata("design:type", String)
], License.prototype, "dbaName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], License.prototype, "issuedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], License.prototype, "renewalDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], License.prototype, "expirationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'nvarchar', length: 256, nullable: true }),
    __metadata("design:type", Object)
], License.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bit', default: () => '0' }),
    __metadata("design:type", Boolean)
], License.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uniqueidentifier', nullable: true }),
    __metadata("design:type", Object)
], License.prototype, "healthCareProviderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uniqueidentifier', nullable: true }),
    __metadata("design:type", Object)
], License.prototype, "healthCareFacilityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'nvarchar', length: 256, nullable: true }),
    __metadata("design:type", Object)
], License.prototype, "healthCareProviderName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'nvarchar', length: 256, nullable: true }),
    __metadata("design:type", Object)
], License.prototype, "description", void 0);
exports.License = License = __decorate([
    (0, typeorm_1.Entity)('licenses')
], License);
//# sourceMappingURL=license.entity.js.map