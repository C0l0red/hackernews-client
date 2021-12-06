import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './services/items.service';
import { ItemsRequestsService } from './services/items.requests.service';

describe('ItemsService', () => {
  let service: ItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemsService, ItemsRequestsService],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
