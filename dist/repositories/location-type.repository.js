"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationTypeRepository = void 0;
const base_repository_1 = require("./base.repository");
const location_type_entity_1 = require("../entities/location-type.entity");
class LocationTypeRepository extends base_repository_1.BaseRepository {
    constructor(ds) {
        super(ds, location_type_entity_1.LocationType, { defaultOrder: { createdAt: 'DESC' } });
    }
    findByCode(code) {
        return this.findOne({ code });
    }
}
exports.LocationTypeRepository = LocationTypeRepository;
//# sourceMappingURL=location-type.repository.js.map