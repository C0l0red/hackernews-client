import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { HttpModule } from '@nestjs/axios';
import { ItemsService } from './services/items.service';
import { ItemsRequestsService } from './services/items.requests.service';

@Module({
  imports: [HttpModule],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsRequestsService],
})
export class ItemsModule {}
