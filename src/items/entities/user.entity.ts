import { HNObject } from "../interfaces/hn-object.interface";

export class User implements HNObject{
    id: string;
    created: number;
    karma: number;
    about: string;
    submitted: number[];

    static toString() {
        return "user";
    }
}