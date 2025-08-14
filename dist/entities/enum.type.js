"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseStatus = exports.EntityName = void 0;
var EntityName;
(function (EntityName) {
    EntityName["LOCATION"] = "locations";
    EntityName["USER"] = "users";
    EntityName["AUDIT_LOG"] = "audit_logs";
})(EntityName || (exports.EntityName = EntityName = {}));
var LicenseStatus;
(function (LicenseStatus) {
    LicenseStatus["APPLIED_FOR"] = "Applied For";
    LicenseStatus["PENDING_PAYMENT"] = "Pending Payment";
    LicenseStatus["PAID"] = "Paid";
    LicenseStatus["PENDING_TO_RENEW"] = "Pending to Renew";
    LicenseStatus["COMPLETED"] = "Completed";
})(LicenseStatus || (exports.LicenseStatus = LicenseStatus = {}));
//# sourceMappingURL=enum.type.js.map