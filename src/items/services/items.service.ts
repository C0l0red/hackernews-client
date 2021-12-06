import { Injectable } from '@nestjs/common';
import { Item } from '../entities/item.entity';
import { StoryList } from '../entities/story-list.entity';
import {ItemsRequestsService} from './items.requests.service';
import * as _ from 'lodash';
import { User } from '../entities/user.entity';
import { Predicate } from '../interfaces/predicate.interface';
import { ItemType } from '../entities/item-type.entity';


@Injectable()
export class ItemsService {  

  constructor (private requestsService: ItemsRequestsService) {}

  async findCommonestWordsInLast25StoryTitles(numberOfWords: number): Promise<string[]> {
    const last25Stories: Item[] = await this.getLatestStories(25);
    const wordCounts: object = this.getWordCountsInTitles(last25Stories);
    const commonWords = this.getMostOccuringWords(wordCounts, numberOfWords);

    return commonWords;
  }

  async findCommonestWordsInPostTitlesFromPastWeek(numberOfWords: number): Promise<string[]> {
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    const weekTimeStamp: number = timestampInSeconds - (60 * 60 * 24 * 7);
    const postsFromPastWeek: Item[] = await this.getPostsFromTimestampToNow(weekTimeStamp);
    const wordCounts: object = this.getWordCountsInTitles(postsFromPastWeek);

    const commonestWords = this.getMostOccuringWords(wordCounts, numberOfWords)

    return commonestWords;
  }

  async findCommonestWordsInLast600StoriesFromUsersWithKarma(numberOfWords: number, minimumKarma: number) {
    const last600StoriesFromUsersWithKarma: Item[] = await this.getLast600StoriesFromUsersWithKarma(minimumKarma);
		const wordCounts: object = this.getWordCountsInTitles(last600StoriesFromUsersWithKarma);

		const commonestWords: string[] = this.getMostOccuringWords(wordCounts, numberOfWords);

		return commonestWords;
  }

  private async getLatestStories(numberOfStories: number): Promise<Item[]> {
    const newStories: number[] = await this.requestsService.getStories(StoryList.NEW);
    const lastStoryItemIds: number[] = newStories.slice(0, numberOfStories);

    return await this.requestsService.getObjectsByObjectId<Item>(Item, lastStoryItemIds);
  }

  private async getPostsFromTimestampToNow(timestamp: number): Promise<Item[]> {
    const maxItemId: number = await this.requestsService.getMaxItemId()
    const items = await this.filterPostsFromPastWeek(maxItemId);
    const posts: Item[] = items.filter(item => item.title)
                                .filter(item => item.time >= timestamp);
    return posts;
  }

  private async getLast600StoriesFromUsersWithKarma(minimumKarma: number): Promise<Item[]> {
		const predicate: Predicate<User> = (user: User) => user.karma >= minimumKarma;
		const stories: Item[] = await this.getStoriesFromUsersWithPredicate(predicate, 600);

		return stories;		
	}
	
	
  private async filterPostsFromPastWeek(maxItemId: number): Promise<Item[]> {
		const itemIds = _.range(maxItemId, maxItemId-35000)
    const items: Item[] = await this.requestsService.groupParallelCalls(Item, itemIds);
    
    return items;
  }

	private async getStoriesFromUsersWithPredicate(predicate: Predicate<User>, numberOfStories: number) {
		let filteredStories: Item[] = [];
		let filteredUserIds: string[] = [], userIdsFilteredOut: string[] = [];
		let latestStoryIds: number[] = await this.requestsService.getStories(StoryList.NEW);
		let earliestItemId: number = latestStoryIds.slice(-1)[0]

		const updateFilteredStories = async (storyItems: Item[]) =>	{
			let userIds: string[] = new Array(...new Set(storyItems.map(item => item.by)))

			userIds = userIds.filter(name => {
				return !(filteredUserIds.includes(name)) && !(userIdsFilteredOut.includes(name))
			});

			let userObjects: User[] = await this.requestsService.getObjectsByObjectId<User>(User, userIds);

			filteredUserIds = filteredUserIds.concat(
														userObjects.filter(predicate)
														.map(user => user.id)
													);
			userIdsFilteredOut = userObjects.filter(user => !(user.id in filteredUserIds))
																.map(user => user.id);

			for (let item of storyItems) {
				if (filteredStories.length >= 600) return;
				if (filteredUserIds.includes(item.by)) {filteredStories.push(item)}
			}
		}

		const storyItems: Item[] = await this.requestsService.groupParallelCalls(Item, latestStoryIds);
		await updateFilteredStories(storyItems);
		
		while (filteredStories.length < numberOfStories) {
			const doUpdateFilteredStories = async () => {
				if (filteredStories.length >= 600) return;
				
				const itemIds: number[] = _.range(earliestItemId - 1, earliestItemId - 1001);
				earliestItemId = itemIds.slice(-1)[0];
				let items: Item[] = await this.requestsService.groupParallelCalls(Item, itemIds);
				items = items.filter(item => item.type === ItemType.STORY);

				await updateFilteredStories(items)
			}

			await Promise.all([
				doUpdateFilteredStories(),
				doUpdateFilteredStories(),
				doUpdateFilteredStories(),
				doUpdateFilteredStories(),
			])
			.catch(err => {console.log("Error doing updateFilterStories", err)});
		}

		return filteredStories;
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
