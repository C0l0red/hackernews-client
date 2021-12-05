import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Item } from '../entities/item.entity';
import {HttpException, HttpStatus} from '@nestjs/common';
import { StoryList } from '../entities/story-list.entity';

@Injectable()
export class ItemsRequestsService {
  private static readonly baseUrl = `https://hacker-news.firebaseio.com/v0`;

  constructor (private httpService: HttpService) {}

  async getStories(storyList: StoryList): Promise<number[]> {
    const response = await this.httpService.axiosRef
                          .get(`${ItemsRequestsService.baseUrl}/${storyList}.json?print=pretty`);
    return response.data as number[];
  }

  async getMaxItemId(): Promise<number> {
    const response = await this.httpService.axiosRef
                            .get(`${ItemsRequestsService.baseUrl}/maxitem.json?print=pretty`);
    return response.data as number;
  }

  async getSingleItem(itemId: number): Promise<Item> {
    return await this.httpService.axiosRef
                    .get(`${ItemsRequestsService.baseUrl}/item/${itemId}.json`)
                    .then(response => response.data as Item)
                    .catch(err => new Item());
  }

  async groupParallelCalls(itemIds: number[]) {
    let splitItemIds: number[][] = this.setupParallelCall(itemIds);

    return await Promise.all(splitItemIds.map(async itemIds => 
                    await this.parallelCall(itemIds)
                ))
                .then(response => response.flatMap(
                  items => items
                ))
                .catch(err => [new Item()]);
  }

  private async parallelCall(itemIds: number[]) {
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
  
  async getItemsByItemId(itemIds: number[]): Promise<Item[]> {
    const endpoints: string[] = itemIds.map(itemId=>
                                  `${ItemsRequestsService.baseUrl}/item/${itemId}.json?print=pretty`

                                  );
    const items: Item[] = await Promise.all(endpoints.map(endpoint => 
        this.httpService.axiosRef.get(endpoint)))

          .then(responses => responses.map(
            response => response.data as Item
          ))

          .catch(err => {
            throw new HttpException('API Call Error', HttpStatus.FAILED_DEPENDENCY)
          });
          
    return items;
  }
}