import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1755136185722 implements MigrationInterface {
    name = 'Init1755136185722'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "license_types" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_08e56128297e619b3acdbac942b" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_6a0dc5f3fad4db3f4d6c2540a92" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_6b2f5cd9a6a1215cc34f73ce923" DEFAULT getdate(), "deleted_at" datetime2, "name" nvarchar(128) CONSTRAINT CHK_c12a31d9060eb0f1db875e385d_ENUM CHECK(name IN ('BTL','AHC','Biomedical Waste','CAQH','CLIA','CMS','CU','DEA','DOH - Sanitation Certificate','Driver License','Elevators','Equipment Calibration','Fire Permit','HCCE','HealthSun','Medicaid','Medical License','OSHA','Professional License','Radiation Control','Simply')) NOT NULL, "description" nvarchar(256), CONSTRAINT "PK_08e56128297e619b3acdbac942b" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "license_types"`);
    }

}
