import { ItemType } from "./item-type.entity";
import {HNObject} from '../interfaces/hn-object.interface'

export class Item implements HNObject {
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

  static toString() {
    return "item"
  }
}
