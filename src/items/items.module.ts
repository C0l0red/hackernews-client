import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { HttpModule } from '@nestjs/axios';
import {ItemsService, ItemsRequestsService} from './services/index'

@Module({
  imports: [HttpModule],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsRequestsService],
})
export class ItemsModule {}
