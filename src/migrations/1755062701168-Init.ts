import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1755062701168 implements MigrationInterface {
    name = 'Init1755062701168'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "healthcare_provider" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_c80305cac93e96e315352445036" DEFAULT NEWSEQUENTIALID(), "fullName" nvarchar(128) NOT NULL, "npi" nvarchar(32) NOT NULL, CONSTRAINT "UQ_1c8b3d87066703de23211f9f576" UNIQUE ("npi"), CONSTRAINT "PK_c80305cac93e96e315352445036" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "license" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_f168ac1ca5ba87286d03b2ef905" DEFAULT NEWSEQUENTIALID(), "licenseType" varchar(32) NOT NULL, "number" nvarchar(64) NOT NULL, "issueDate" date NOT NULL, "expiryDate" date NOT NULL, "providerId" uniqueidentifier, "centerId" uniqueidentifier, CONSTRAINT "PK_f168ac1ca5ba87286d03b2ef905" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4b208a110f87c6719145187081" ON "license" ("licenseType", "number") `);
        await queryRunner.query(`CREATE TABLE "center" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_ef3dda6630851ce77a9fe7a0c9d" DEFAULT NEWSEQUENTIALID(), "name" nvarchar(128) NOT NULL, "locationId" uniqueidentifier NOT NULL, CONSTRAINT "PK_ef3dda6630851ce77a9fe7a0c9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "location" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_876d7bdba03c72251ec4c2dc827" DEFAULT NEWSEQUENTIALID(), "name" nvarchar(128) NOT NULL, "addressLine1" nvarchar(128) NOT NULL, "addressLine2" nvarchar(128), "city" nvarchar(64) NOT NULL, "state" nvarchar(64) NOT NULL, "zip" nvarchar(16) NOT NULL, "country" nvarchar(64) NOT NULL CONSTRAINT "DF_c67b255b0a76969d7edb26fbf25" DEFAULT 'US', CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "license" ADD CONSTRAINT "FK_45fd9db6d38239e33c5a7543971" FOREIGN KEY ("providerId") REFERENCES "healthcare_provider"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "license" ADD CONSTRAINT "FK_f505cd4c6bb424e60e8a3059b0d" FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "center" ADD CONSTRAINT "FK_276ab4baa324c9b73783bb05ce8" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "center" DROP CONSTRAINT "FK_276ab4baa324c9b73783bb05ce8"`);
        await queryRunner.query(`ALTER TABLE "license" DROP CONSTRAINT "FK_f505cd4c6bb424e60e8a3059b0d"`);
        await queryRunner.query(`ALTER TABLE "license" DROP CONSTRAINT "FK_45fd9db6d38239e33c5a7543971"`);
        await queryRunner.query(`DROP TABLE "location"`);
        await queryRunner.query(`DROP TABLE "center"`);
        await queryRunner.query(`DROP INDEX "IDX_4b208a110f87c6719145187081" ON "license"`);
        await queryRunner.query(`DROP TABLE "license"`);
        await queryRunner.query(`DROP TABLE "healthcare_provider"`);
    }

}
