"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationTypeService = exports.updateLocationTypeSchema = exports.createLocationTypeSchema = void 0;
const zod_1 = require("zod");
const location_type_entity_1 = require("../entities/location-type.entity");
const location_type_repository_1 = require("../repositories/location-type.repository");
exports.createLocationTypeSchema = zod_1.z.object({
    code: zod_1.z.enum(location_type_entity_1.LocationTypeCode),
    displayName: zod_1.z.string().min(1).max(128),
    description: zod_1.z.string().max(256).optional().nullable(),
});
exports.updateLocationTypeSchema = exports.createLocationTypeSchema.partial();
class LocationTypeService {
    constructor(ds) {
        this.repo = new location_type_repository_1.LocationTypeRepository(ds);
    }
    list(page, pageSize) {
        return this.repo.findPaged(page, pageSize);
    }
    get(id) {
        return this.repo.findById(id);
    }
    create(payload) {
        const data = exports.createLocationTypeSchema.parse(payload);
        return this.repo.createOne(data);
    }
    update(id, payload) {
        const data = exports.updateLocationTypeSchema.parse(payload);
        return this.repo.updateOne(id, data);
    }
    remove(id) {
        return this.repo.softDelete(id);
    }
}
exports.LocationTypeService = LocationTypeService;
//# sourceMappingURL=location-type.service.js.map