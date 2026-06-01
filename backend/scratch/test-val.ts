import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SalesQueryDto } from '../src/modules/sales/dto/sale.dto';

async function test() {
  const queryData = {
    page: '1',
    limit: '20',
    search: '',
    status: 'draft',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    ownSalesOnly: 'true'
  };

  const dtoInstance = plainToInstance(SalesQueryDto, queryData);
  const errors = await validate(dtoInstance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  console.log('DTO Instance:', dtoInstance);
  console.log('Validation Errors:', JSON.stringify(errors, null, 2));
}

test().catch(console.error);
