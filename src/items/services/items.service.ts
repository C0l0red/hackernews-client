import { Injectable } from '@nestjs/common';
import { Item } from '../entities/item.entity';
import { StoryList } from '../entities/story-list.entity';
import {ItemsRequestsService} from './items.requests.service';
import * as _ from 'lodash';


@Injectable()
export class ItemsService {
  
  private topTenWordsInLast25Stories: string[];
  private topTenWordsInPostsFromPastWeek: string[];

  constructor (private requestsService: ItemsRequestsService) {}

  async findCommonestWordsInLast25StoryTitles(numberOfWords: number): Promise<string[]> {
    const last25Stories: Item[] = await this.getLatestStories(25);
    const wordCounts: object = this.getWordCountsInTitles(last25Stories);
    this.topTenWordsInLast25Stories = this.getMostOccuringWords(wordCounts, numberOfWords);

    return this.topTenWordsInLast25Stories;
  }

  async findCommonestWordsInPostTitlesFromPastWeek(numberOfWords: number): Promise<string[]> {
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    const weekTimeStamp: number = timestampInSeconds - (60 * 60 * 24 * 7);
    const postsFromPastWeek: Item[] = await this.getPostsFromTimestampToNow(weekTimeStamp);
    const wordCounts: object = this.getWordCountsInTitles(postsFromPastWeek);

    this.topTenWordsInPostsFromPastWeek = this.getMostOccuringWords(wordCounts, numberOfWords)

    return this.topTenWordsInPostsFromPastWeek;
  }

  private async getLatestStories(numberOfStories: number): Promise<Item[]> {
    const newStories: number[] = await this.requestsService.getStories(StoryList.NEW);
    const lastStoryItemIds: number[] = newStories.slice(0, numberOfStories);

    return await this.requestsService.getItemsByItemId(lastStoryItemIds);
  }

  private async getPostsFromTimestampToNow(timestamp: number): Promise<Item[]> {
    const maxItemId: number = await this.requestsService.getMaxItemId()
    const items = await this.filterPostsFromPastWeek(maxItemId);
    const posts: Item[] = items.filter(item => item.title)
                                .filter(item => item.time >= timestamp);
    return posts;
  }


  private async filterPostsFromPastWeek(maxItemId: number): Promise<Item[]> {
    const itemIds = _.range(maxItemId, maxItemId-35000)
    const items: Item[] = await this.requestsService.groupParallelCalls(itemIds);
    
    return items;
  }

  

  private getWordCountsInTitles(items: Item[]): object {
    const titleWords: string[] = items.flatMap(item => 
                                    item.title.toLowerCase()
                                        .replace(/[^a-z\s]/gi, "")
                                        .split(/\s/)
                                    );
            
    const wordCounts: object = {};

    for (let word of titleWords){
      if (word === "") continue;
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }

    return wordCounts;
  }

  private getMostOccuringWords(wordCount: object, limit: number): string[] {
    const sortedWordCount: any[][] = Object.entries(wordCount)
                                      .sort((x,y) => (x[1]-y[1]))
                                      .slice(0, limit);

    const mostOccuringWords: string[] = sortedWordCount
                                          .map(entry => entry[0] as string);
    return mostOccuringWords;
  }
  
}