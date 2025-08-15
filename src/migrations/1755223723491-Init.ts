import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1755223723491 implements MigrationInterface {
    name = 'Init1755223723491'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "license_types" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_08e56128297e619b3acdbac942b" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_6a0dc5f3fad4db3f4d6c2540a92" DEFAULT GETUTCDATE(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_6b2f5cd9a6a1215cc34f73ce923" DEFAULT GETUTCDATE(), "deleted_at" datetime2, "code" nvarchar(128) NOT NULL, "display_name" nvarchar(128) NOT NULL, "description" nvarchar(256), CONSTRAINT "UQ_2e7f2caf6d251f0255f589d890b" UNIQUE ("code"), CONSTRAINT "PK_08e56128297e619b3acdbac942b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_LICENSE_TYPE_CODE" ON "license_types" ("code") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_LICENSE_TYPE_CODE" ON "license_types"`);
        await queryRunner.query(`DROP TABLE "license_types"`);
    }

}
