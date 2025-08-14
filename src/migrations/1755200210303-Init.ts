import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1755200210303 implements MigrationInterface {
    name = 'Init1755200210303'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "addresses" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_745d8f43d3af10ab8247465e450" DEFAULT NEWSEQUENTIALID(), "created_at" datetime2 NOT NULL CONSTRAINT "DF_8813e791fe4c6cc9de77c950c70" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_f695ee88c4fefac775eb871aea2" DEFAULT getdate(), "deleted_at" datetime2, "street" nvarchar(128) NOT NULL, "city" nvarchar(128) NOT NULL, "state" nvarchar(128) NOT NULL CONSTRAINT "DF_dec4ebd2fa2ab82db7228e08189" DEFAULT 'FL', "zip" nvarchar(10) NOT NULL, "country" nvarchar(128) NOT NULL CONSTRAINT "DF_35936c20d74117b96ca37c06dbf" DEFAULT 'United States', "type" nvarchar(50) CONSTRAINT CHK_eea30fc9719b01d6fa350be740_ENUM CHECK(type IN ('Mailing','Billing','Shipping','Home')) NOT NULL, "drivingDirections" nvarchar(256), "description" nvarchar(256), "timeZone" nvarchar(256), "leadSource" nvarchar(20), "location_type_id" uniqueidentifier NOT NULL, CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IX_addresses_location_type_id" ON "addresses" ("location_type_id") `);
        await queryRunner.query(`ALTER TABLE "addresses" ADD CONSTRAINT "FK_93c5c6140ade77525e4bde33091" FOREIGN KEY ("location_type_id") REFERENCES "location_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_93c5c6140ade77525e4bde33091"`);
        await queryRunner.query(`DROP INDEX "IX_addresses_location_type_id" ON "addresses"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
    }

}
