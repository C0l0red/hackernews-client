import { Controller, Get, Query } from '@nestjs/common';
import { ItemsService } from './services/items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('last-25-stories/commonest-words-in-titles')
  findCommonestWordsInLast25StoryTitles(@Query('numberOfWords') numberOfWords: number=10) {
    return this.itemsService.findCommonestWordsInLast25StoryTitles(numberOfWords)
  }

  @Get('past-week-posts/commonest-words-in-titles')
  findCommonestWordsInPostTitlesFromPastWeek(@Query('numberOfWords') numberOfWords: number=10) {
    return this.itemsService.findCommonestWordsInPostTitlesFromPastWeek(numberOfWords);
  }

  @Get('')
  find() {
    return this.itemsService
  }

}
