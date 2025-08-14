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
exports.LicenseType = exports.LicenseRecordType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
var LicenseRecordType;
(function (LicenseRecordType) {
    LicenseRecordType["BTL"] = "BTL";
    LicenseRecordType["AHC"] = "AHC";
    LicenseRecordType["BIOMEDICAL_WASTE"] = "Biomedical Waste";
    LicenseRecordType["CAQH"] = "CAQH";
    LicenseRecordType["CLIA"] = "CLIA";
    LicenseRecordType["CMS"] = "CMS";
    LicenseRecordType["CU"] = "CU";
    LicenseRecordType["DEA"] = "DEA";
    LicenseRecordType["DOH_SANITATION_CERTIFICATE"] = "DOH - Sanitation Certificate";
    LicenseRecordType["DRIVER_LICENSE"] = "Driver License";
    LicenseRecordType["ELEVATORS"] = "Elevators";
    LicenseRecordType["EQUIPMENT_CALIBRATION"] = "Equipment Calibration";
    LicenseRecordType["FIRE_PERMIT"] = "Fire Permit";
    LicenseRecordType["HCCE"] = "HCCE";
    LicenseRecordType["HEALTH_SUN"] = "HealthSun";
    LicenseRecordType["MEDICAID"] = "Medicaid";
    LicenseRecordType["MEDICAL_LICENSE"] = "Medical License";
    LicenseRecordType["OSHA"] = "OSHA";
    LicenseRecordType["PROFESSIONAL_LICENSE"] = "Professional License";
    LicenseRecordType["RADIATION_CONTROL"] = "Radiation Control";
    LicenseRecordType["SIMPLY"] = "Simply";
})(LicenseRecordType || (exports.LicenseRecordType = LicenseRecordType = {}));
let LicenseType = class LicenseType extends base_entity_1.BaseEntity {
};
exports.LicenseType = LicenseType;
__decorate([
    (0, typeorm_1.Column)({
        type: 'nvarchar',
        length: 128,
        enum: LicenseRecordType,
    }),
    __metadata("design:type", String)
], LicenseType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'nvarchar', length: 256, nullable: true }),
    __metadata("design:type", Object)
], LicenseType.prototype, "description", void 0);
exports.LicenseType = LicenseType = __decorate([
    (0, typeorm_1.Entity)('license_types')
], LicenseType);
//# sourceMappingURL=license-type.entity.js.map