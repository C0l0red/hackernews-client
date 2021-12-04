import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Item } from './entities/item.entity';
import {HttpException, HttpStatus} from '@nestjs/common';
import { StoryList } from './entities/story-list.entity';
import * as _ from 'lodash';


@Injectable()
export class ItemsService {
  private readonly baseUrl = `https://hacker-news.firebaseio.com/v0`;
  private readonly weekTimeStamp: number;
  private topTenWordsInLast25Stories: string[];
  private topTenWordsInLastWeekStories: string[];

  constructor (private httpService: HttpService) {
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    this.weekTimeStamp = timestampInSeconds - (60 * 60 * 24 * 7);
  }

  async findTopTenWordsInLast25StoryTitles(): Promise<string[]> {
    const last25Stories: Item[] = await this.getLast25Stories();
    const wordCounts: object = this.getWordCountsInTitles(last25Stories);
    this.topTenWordsInLast25Stories = this.getMostOccuringWords(wordCounts, 10);

    return this.topTenWordsInLast25Stories;
  }

  async findTopTenWordsInStoryTitlesFromPastWeek() {
    const postsFromPastWeek: Item[] = await this.getPostsFromPastWeek();
    const wordCounts: object = this.getWordCountsInTitles(postsFromPastWeek);
    return this.getMostOccuringWords(wordCounts, 10)
  }

  private async getLast25Stories(): Promise<Item[]> {
    const newStories: number[] = await this.getStories(StoryList.NEW);
    const last25ItemIds: number[] = newStories.slice(0, 25);
    return await this.getItemsByItemId(last25ItemIds);
  }

  private async getPostsFromPastWeek() {
    const maxItemId: number = await this.getMaxItemId()
    const items = await this.filterPostsFromPastWeek(maxItemId);
    const posts: Item[] = items.filter(item => item.title)
                                .filter(item => item.time >= this.weekTimeStamp);
    return posts;
  }

  private async setAllStoryItems() {
    // this.allStoryIds.sort((a,b) => b - a);
  }

  private async getStories(storyList: StoryList): Promise<number[]> {
    const response = await this.httpService.axiosRef.get(`${this.baseUrl}/${storyList}.json?print=pretty`);
    return response.data as number[];
  }

  private async getMaxItemId(): Promise<number> {
    const response = await this.httpService.axiosRef.get(`${this.baseUrl}/maxitem.json?print=pretty`);
    return response.data as number;
  }

  private async filterPostsFromPastWeek(maxItemId: number) {
    const itemIds = _.range(maxItemId, maxItemId-35000)
    const items: Item[] = await this.groupParallelCalls(this.getItemsByItemId, itemIds);
    
    return items;
  }

  private async groupParallelCalls(func: Function, itemIds: number[]) {
    let splitItemIds: number[][] = this.setupParallelCall(itemIds);
    console.log(`${splitItemIds[0].length}`)

    return await Promise.all(splitItemIds.map(async itemIds => 
                    await this.parallelCall(func, itemIds)
                ))
                .then(response => response.flatMap(
                  items => items
                ))
                .catch(err => [new Item()]);
  }

  private async parallelCall(func: Function, itemIds: number[]) {
    const splitItemIds: number[][] = this.setupParallelCall(itemIds);

    return await Promise.all(splitItemIds.map(async itemIds => 
                    await this.getItemsByItemId(itemIds)
                ))
                .then(response => response.flatMap(
                  items => items
                ))
                .catch(err => [new Item()]);
  }

  private setupParallelCall(itemIds: number[]) {
    const splitItemIds: number[][] = [];
    const tenthOfLength: number = itemIds.length * 1/10;
    let start: number = 0, end: number = tenthOfLength;

    for (let i = 0; i < 10; i++) {
      splitItemIds.push(itemIds.slice(start, end));
      start += tenthOfLength, end += tenthOfLength;
    }

    return splitItemIds;
  }

  private async getSingleItem(itemId: number): Promise<Item> {
    return await this.httpService.axiosRef
                    .get(`${this.baseUrl}/item/${itemId}.json`)
                    .then(response => response.data as Item)
                    .catch(err => new Item());
  }

  private async getItemsByItemId(itemIds: number[]): Promise<Item[]> {
    const endpoints: string[] = itemIds.map(itemId=>
                                  `${this.baseUrl}/item/${itemId}.json?print=pretty`
                                  );
      console.log(endpoints)
    const items: Item[] = await Promise.all(endpoints.map(endpoint => 
        this.httpService.axiosRef.get(endpoint)))

          .then(responses => responses.map(
            response => response.data as Item
          ))

          .catch(err => {
            throw new HttpException('API Call Error', HttpStatus.FAILED_DEPENDENCY)
          });
    console.log(items)
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
