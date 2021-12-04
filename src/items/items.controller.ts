import { Controller, Get } from '@nestjs/common';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('last-25-stories')
  findTopTenWordsInLast25StoryTitles() {
    return this.itemsService.findTopTenWordsInLast25StoryTitles()
  }

  @Get('past-week-stories')
  findTopTenWordsInStoryTitlesFromPastWeek() {
    return this.itemsService.findTopTenWordsInStoryTitlesFromPastWeek();
  }



}
