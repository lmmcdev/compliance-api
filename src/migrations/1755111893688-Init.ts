import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1755111893688 implements MigrationInterface {
    name = 'Init1755111893688'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "license_types" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_08e56128297e619b3acdbac942b" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_6a0dc5f3fad4db3f4d6c2540a92" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_6b2f5cd9a6a1215cc34f73ce923" DEFAULT getdate(), "deleted_at" datetime2, "name" nvarchar(128) NOT NULL, "description" nvarchar(256), CONSTRAINT "PK_08e56128297e619b3acdbac942b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "locations" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_7cc1c9e3853b94816c094825e74" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_6078d870207b8386e700dfb0345" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_ff339711522e18cb1540aa30e7f" DEFAULT getdate(), "deleted_at" datetime2, "name" nvarchar(128) NOT NULL, "description" nvarchar(256), CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "licenses" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_da5021501ce80efa03de6f40086" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_60a81f5bbc13a42963a478c4e8f" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_296b29177ee41877ccf5bf9e507" DEFAULT getdate(), "deleted_at" datetime2, "number" int NOT NULL, "primaryName" nvarchar(256) NOT NULL, "dbaName" nvarchar(256), "issuedDate" datetime, "renewalDate" datetime, "expirationDate" datetime, "status" nvarchar(256), "isActive" bit NOT NULL CONSTRAINT "DF_65143454d6d8e80747dee0a0f0f" DEFAULT 0, "healthCareProviderId" uniqueidentifier, "healthCareFacilityId" uniqueidentifier, "healthCareProviderName" nvarchar(256), "description" nvarchar(256), CONSTRAINT "PK_da5021501ce80efa03de6f40086" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "DF_88dcc148d532384790ab874c3d6"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "timestamp"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "entityName" nvarchar(128) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "entityId" uniqueidentifier`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "userId" uniqueidentifier`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "details"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "details" nvarchar(max)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "details"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "details" text`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "userId" nvarchar(128) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "entityId"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "entityName"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "timestamp" datetime2 NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "DF_88dcc148d532384790ab874c3d6" DEFAULT getdate() FOR "timestamp"`);
        await queryRunner.query(`DROP TABLE "licenses"`);
        await queryRunner.query(`DROP TABLE "locations"`);
        await queryRunner.query(`DROP TABLE "license_types"`);
    }

}
