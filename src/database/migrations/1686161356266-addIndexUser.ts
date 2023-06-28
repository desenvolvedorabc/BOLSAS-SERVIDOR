import { MigrationInterface, QueryRunner } from 'typeorm';

export class addIndexUser1686161356266 implements MigrationInterface {
  name = 'addIndexUser1686161356266';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX `IDX_5ff9707f349f8b80e7e896b12f` ON `users` (`partnerStateId`, `regionalPartnerId`, `city`)',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_cb5c11ac2785c5a0ab53d17fa4` ON `users` (`partnerStateId`, `regionalPartnerId`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX `IDX_cb5c11ac2785c5a0ab53d17fa4` ON `users`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_5ff9707f349f8b80e7e896b12f` ON `users`',
    );
  }
}
