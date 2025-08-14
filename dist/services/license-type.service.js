"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseTypeService = exports.updateSchema = exports.createSchema = void 0;
const zod_1 = require("zod");
const license_type_entity_1 = require("../entities/license-type.entity");
const license_type_repository_1 = require("../repositories/license-type.repository");
exports.createSchema = zod_1.z.object({
    name: zod_1.z.enum(license_type_entity_1.LicenseRecordType),
    description: zod_1.z.string().max(256).optional().nullable(),
});
exports.updateSchema = exports.createSchema.partial();
class LicenseTypeService {
    constructor(ds) {
        this.repo = new license_type_repository_1.LicenseTypeRepository(ds);
    }
    list(page, pageSize) {
        return this.repo.findPaged(page, pageSize);
    }
    get(id) {
        return this.repo.findById(id);
    }
    create(payload) {
        const data = exports.createSchema.parse(payload);
        return this.repo.createOne(data);
    }
    update(id, payload) {
        const data = exports.updateSchema.parse(payload);
        return this.repo.updateOne(id, data);
    }
    remove(id) {
        return this.repo.softDelete(id);
    }
}
exports.LicenseTypeService = LicenseTypeService;
//# sourceMappingURL=license-type.service.js.map