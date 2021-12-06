import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Item } from '../entities/item.entity';
import {HttpException, HttpStatus} from '@nestjs/common';
import { StoryList } from '../entities/story-list.entity';
import {HNObject} from '../interfaces/hn-object.interface'

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

  async groupParallelCalls<Type>(Type: HNObject, objectIds: number[]): Promise<Type[]> {
    let splitObjectIds: number[][] = this.setupParallelCall(objectIds);

    return await Promise.all(splitObjectIds.map(async objectIds => 
                    await this.parallelCall<Type>(Type, objectIds)
                ))
                .then(response => response.flatMap(
                  items => items as Type[]
                ))
                .catch(err => Array<Type>());
  }

  private async parallelCall<Type>(Type: HNObject, objectIds: number[]): Promise<Type[]> {
    const splitObjectIds: number[][] = this.setupParallelCall(objectIds);

    return await Promise.all(splitObjectIds.map(async objectIds => 
                    await this.getObjectsByObjectId<Type>(Type, objectIds)
                ))
                .then(response => response.flatMap(
                  items => items as Type[]
                ))
                .catch(err => Array<Type>());
  }

  private setupParallelCall(objectIds: number[]) {
    const splitObjectIds: number[][] = [];
    const tenthOfLength: number = objectIds.length * 1/10;
    let start: number = 0, end: number = tenthOfLength;

    for (let i = 0; i < 10; i++) {
      splitObjectIds.push(objectIds.slice(start, end));
      start += tenthOfLength, end += tenthOfLength;
    }

    return splitObjectIds;
  }
  
  async getObjectsByObjectId<Type>(Type: HNObject, objectIds: number[]): Promise<Type[]> {
    const endpoints: string[] = objectIds.map(objectId=>
                                  `${ItemsRequestsService.baseUrl}/${Type.toString()}/${objectId}.json?print=pretty`

                                  );
    const objects: Type[] = await Promise.all(endpoints.map(endpoint => 
        this.httpService.axiosRef.get(endpoint)))

          .then(responses => responses.map(
            response => response.data as Type
          ))

          .catch(err => {
            throw new HttpException('API Call Error', HttpStatus.FAILED_DEPENDENCY)
          });

    return objects;
  }
}