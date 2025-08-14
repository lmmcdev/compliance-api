"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseTypeRepository = void 0;
const base_repository_1 = require("./base.repository");
const license_type_entity_1 = require("../entities/license-type.entity");
class LicenseTypeRepository extends base_repository_1.BaseRepository {
    constructor(ds) {
        super(ds, license_type_entity_1.LicenseType, {
            defaultOrder: { createdAt: 'DESC' },
            maxPageSize: 50,
        });
    }
}
exports.LicenseTypeRepository = LicenseTypeRepository;
//# sourceMappingURL=license-type.repository.js.map