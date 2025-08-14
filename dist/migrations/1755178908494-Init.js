"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Init1755178908494 = void 0;
class Init1755178908494 {
    constructor() {
        this.name = 'Init1755178908494';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "location_types" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_a8e0edf03ea5715ed995151d637" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_341188fd21c1c58cdd1c930aab4" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_76d74e985f4995022c8058d8e4d" DEFAULT getdate(), "deleted_at" datetime2, "code" nvarchar(128) CONSTRAINT CHK_310c6ceb87438d6f74e1fd9572_ENUM CHECK(code IN ('Corporate','Dental','Gym','Physical Therapy','Primary Care','Specialty','Sales','Pharmacy','Adult Day Care','Optical','Other')) NOT NULL, "display_name" nvarchar(128) NOT NULL, "description" nvarchar(256), CONSTRAINT "PK_a8e0edf03ea5715ed995151d637" PRIMARY KEY ("id"))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "location_types"`);
    }
}
exports.Init1755178908494 = Init1755178908494;
//# sourceMappingURL=1755178908494-Init.js.map