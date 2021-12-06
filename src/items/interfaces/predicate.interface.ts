export interface Predicate<Type> {
    (value: Type, index: number, array: Type[]): boolean
}