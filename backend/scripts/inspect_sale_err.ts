import { DataSource } from 'typeorm';
import { Sale } from '../src/modules/sales/entities/sale.entity';
import { Party } from '../src/modules/parties/entities/party.entity';
import { Department } from '../src/modules/departments/entities/department.entity';
import { OutboxEvent } from '../src/common/entities/outbox-event.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ERPCRMDB',
  entities: [Sale, Party, Department, OutboxEvent],
  synchronize: false,
});

async function run() {
  await dataSource.initialize();
  console.log('Connected to DB!');

  const saleId = '12025';

  // 1. Fetch sale
  const sale = await dataSource.getRepository(Sale).findOne({
    where: { id: saleId },
    relations: ['items'],
  });

  if (!sale) {
    throw new Error('Sale not found!');
  }

  console.log('--- SALE ---');
  console.log('Code:', sale.code);
  console.log('Status:', sale.status);
  console.log('DepartmentId:', sale.departmentId);
  console.log('PartyId:', sale.partyId);
  console.log('Items count:', sale.items?.length);

  // 2. Fetch departments
  const depts = await dataSource.getRepository(Department).find();
  console.log('--- DEPARTMENTS ---');
  depts.forEach(d => console.log(`ID: ${d.id}, Name: ${d.name}, State: ${d.state}`));

  // 3. Test transaction
  console.log('--- TESTING APPROVAL TRANSACTION ---');
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const manager = queryRunner.manager;

    const s = await manager.findOne(Sale, {
      where: { id: saleId },
      relations: ['items'],
      lock: { mode: 'pessimistic_write' },
    });
    
    if (!s) {
      throw new Error('Sale not found in tx');
    }
    console.log('Locked sale record successfully');

    const p = await manager.findOne(Party, {
      where: { id: s.partyId },
      lock: { mode: 'pessimistic_write' },
    });
    
    if (!p) {
      throw new Error('Party not found in tx');
    }
    console.log('Locked party record successfully');

    s.status = 'approved';
    s.departmentId = depts[0].id;
    s.updatedBy = '1';

    console.log('Saving sale...');
    await manager.save(Sale, s);
    console.log('Saved sale successfully');

    console.log('Saving outbox event...');
    const outbox = manager.create(OutboxEvent, {
      topic: 'sale.approved',
      payload: {
        sale: { id: s.id, code: s.code },
      },
      status: 'pending' as any,
      attempts: 0,
    });
    await manager.save(OutboxEvent, outbox);
    console.log('Saved outbox event successfully');

    await queryRunner.commitTransaction();
    console.log('Transaction committed successfully! Test passed!');
  } catch (err: any) {
    console.error('TRANSACTION FAILED WITH ERROR:');
    console.error(err.message || err);
    if (err.stack) {
      console.error(err.stack);
    }
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

run().catch(console.error);
