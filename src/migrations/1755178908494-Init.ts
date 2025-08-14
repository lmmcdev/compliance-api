import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1755178908494 implements MigrationInterface {
    name = 'Init1755178908494'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "location_types" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_a8e0edf03ea5715ed995151d637" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_341188fd21c1c58cdd1c930aab4" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_76d74e985f4995022c8058d8e4d" DEFAULT getdate(), "deleted_at" datetime2, "code" nvarchar(128) CONSTRAINT CHK_310c6ceb87438d6f74e1fd9572_ENUM CHECK(code IN ('Corporate','Dental','Gym','Physical Therapy','Primary Care','Specialty','Sales','Pharmacy','Adult Day Care','Optical','Other')) NOT NULL, "display_name" nvarchar(128) NOT NULL, "description" nvarchar(256), CONSTRAINT "PK_a8e0edf03ea5715ed995151d637" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "location_types"`);
    }

}
