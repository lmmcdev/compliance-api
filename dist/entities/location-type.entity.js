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
exports.LocationType = exports.LocationTypeCode = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
var LocationTypeCode;
(function (LocationTypeCode) {
    LocationTypeCode["CORPORATE"] = "Corporate";
    LocationTypeCode["DENTAL"] = "Dental";
    LocationTypeCode["GYM"] = "Gym";
    LocationTypeCode["PHYSICAL_THERAPY"] = "Physical Therapy";
    LocationTypeCode["PRIMARY_CARE"] = "Primary Care";
    LocationTypeCode["SPECIALTY"] = "Specialty";
    LocationTypeCode["SALES"] = "Sales";
    LocationTypeCode["PHARMACY"] = "Pharmacy";
    LocationTypeCode["ADULT_DAY_CARE"] = "Adult Day Care";
    LocationTypeCode["OPTICAL"] = "Optical";
    LocationTypeCode["OTHER"] = "Other";
})(LocationTypeCode || (exports.LocationTypeCode = LocationTypeCode = {}));
let LocationType = class LocationType extends base_entity_1.BaseEntity {
};
exports.LocationType = LocationType;
__decorate([
    (0, typeorm_1.Column)({ name: 'code', type: 'nvarchar', length: 128, enum: LocationTypeCode }),
    __metadata("design:type", String)
], LocationType.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_name', type: 'nvarchar', length: 128 }),
    __metadata("design:type", String)
], LocationType.prototype, "displayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description', type: 'nvarchar', length: 256, nullable: true }),
    __metadata("design:type", Object)
], LocationType.prototype, "description", void 0);
exports.LocationType = LocationType = __decorate([
    (0, typeorm_1.Entity)({ name: 'location_types', schema: 'dbo' })
], LocationType);
//# sourceMappingURL=location-type.entity.js.map