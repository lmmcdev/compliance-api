"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Init1755185809534 = void 0;
class Init1755185809534 {
    constructor() {
        this.name = 'Init1755185809534';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "license_types" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_08e56128297e619b3acdbac942b" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_6a0dc5f3fad4db3f4d6c2540a92" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_6b2f5cd9a6a1215cc34f73ce923" DEFAULT getdate(), "deleted_at" datetime2, "code" nvarchar(128) CONSTRAINT CHK_092635f67950dbd85ed31702e8_ENUM CHECK(code IN ('BTL','AHC','Biomedical Waste','CAQH','CLIA','CMS','CU','DEA','DOH - Sanitation Certificate','Driver License','Elevators','Equipment Calibration','Fire Permit','HCCE','HealthSun','Medicaid','Medical License','OSHA','Professional License','Radiation Control','Simply')) NOT NULL, "display_name" nvarchar(128) NOT NULL, "description" nvarchar(256), CONSTRAINT "PK_08e56128297e619b3acdbac942b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "location_types" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_a8e0edf03ea5715ed995151d637" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_341188fd21c1c58cdd1c930aab4" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_76d74e985f4995022c8058d8e4d" DEFAULT getdate(), "deleted_at" datetime2, "code" nvarchar(128) CONSTRAINT CHK_310c6ceb87438d6f74e1fd9572_ENUM CHECK(code IN ('Corporate','Dental','Gym','Physical Therapy','Primary Care','Specialty','Sales','Pharmacy','Adult Day Care','Optical','Other')) NOT NULL, "display_name" nvarchar(128) NOT NULL, "description" nvarchar(256), CONSTRAINT "PK_a8e0edf03ea5715ed995151d637" PRIMARY KEY ("id"))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "location_types"`);
        await queryRunner.query(`DROP TABLE "license_types"`);
    }
}
exports.Init1755185809534 = Init1755185809534;
//# sourceMappingURL=1755185809534-Init.js.map