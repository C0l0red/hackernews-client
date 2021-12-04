import { ItemType } from "./item-type.entity";

export class Item {
  id: number;
  deleted: boolean;
	type: ItemType;
  by: string;
	time: number;
  text: string;
  dead: boolean;
  parent: number;
  poll: number;
  kids: number[];
  url: string;
  score: number;
  title: string;
  parts: number[];
  descendants: number;
}
