import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1755219168424 implements MigrationInterface {
    name = 'Init1755219168424'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "addresses" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_745d8f43d3af10ab8247465e450" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_8813e791fe4c6cc9de77c950c70" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_f695ee88c4fefac775eb871aea2" DEFAULT getdate(), "deleted_at" datetime2, "street" nvarchar(128) NOT NULL, "city" nvarchar(128) NOT NULL, "state" nvarchar(128) NOT NULL CONSTRAINT "DF_dec4ebd2fa2ab82db7228e08189" DEFAULT 'FL', "zip" nvarchar(10) NOT NULL, "country" nvarchar(128) NOT NULL CONSTRAINT "DF_35936c20d74117b96ca37c06dbf" DEFAULT 'United States', "addressType" nvarchar(50) CONSTRAINT CHK_0bbe5317c66193b72b051e779d_ENUM CHECK(addressType IN ('Mailing','Billing','Shipping','Home')) NOT NULL, "drivingDirections" nvarchar(256), "description" nvarchar(256), "timeZone" nvarchar(256), "leadSource" nvarchar(20), "location_type_id" uniqueidentifier NOT NULL, CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IX_addresses_location_type_id" ON "addresses" ("location_type_id") `);
        await queryRunner.query(`CREATE TABLE "location_types" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_a8e0edf03ea5715ed995151d637" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_341188fd21c1c58cdd1c930aab4" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_76d74e985f4995022c8058d8e4d" DEFAULT getdate(), "deleted_at" datetime2, "code" nvarchar(128) CONSTRAINT CHK_310c6ceb87438d6f74e1fd9572_ENUM CHECK(code IN ('Corporate','Dental','Gym','Physical Therapy','Primary Care','Specialty','Sales','Pharmacy','Adult Day Care','Optical','Other')) NOT NULL, "display_name" nvarchar(128) NOT NULL, "description" nvarchar(256), CONSTRAINT "PK_a8e0edf03ea5715ed995151d637" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "license_types" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "license_types" ADD "code" nvarchar(128) CONSTRAINT CHK_092635f67950dbd85ed31702e8_ENUM CHECK(code IN ('BTL','AHC','Biomedical Waste','CAQH','CLIA','CMS','CU','DEA','DOH - Sanitation Certificate','Driver License','Elevators','Equipment Calibration','Fire Permit','HCCE','HealthSun','Medicaid','Medical License','OSHA','Professional License','Radiation Control','Simply')) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "license_types" ADD "display_name" nvarchar(128) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD CONSTRAINT "FK_93c5c6140ade77525e4bde33091" FOREIGN KEY ("location_type_id") REFERENCES "location_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_93c5c6140ade77525e4bde33091"`);
        await queryRunner.query(`ALTER TABLE "license_types" DROP COLUMN "display_name"`);
        await queryRunner.query(`ALTER TABLE "license_types" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "license_types" ADD "name" nvarchar(128) CONSTRAINT CHK_c12a31d9060eb0f1db875e385d_ENUM CHECK(name IN ('BTL','AHC','Biomedical Waste','CAQH','CLIA','CMS','CU','DEA','DOH - Sanitation Certificate','Driver License','Elevators','Equipment Calibration','Fire Permit','HCCE','HealthSun','Medicaid','Medical License','OSHA','Professional License','Radiation Control','Simply')) NOT NULL`);
        await queryRunner.query(`DROP TABLE "location_types"`);
        await queryRunner.query(`DROP INDEX "IX_addresses_location_type_id" ON "addresses"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
    }

}
