import {
    of, success, failure, combine,
    get, getOrElse, getOrElseGet, getOrElseThrow, run,
    map, mapIf, flatMap, flatMapIf, mapFailure,
    andThen,  andFinally,
    onSuccess, onFailure,
    filter, filterNot, mapFailureWith,
    recover, recoverWith,
} from "./functions";
import {Result} from "./Result";


export type Step = ((() => Promise<Result>) | ((prev: Result) => Promise<Result>));

export class Try<T> {
    public _finalResult?: Result = undefined;
    public readonly steps: Step[] = [];
    private constructor(steps: Step[] = []) {
        this.steps = steps;
    }

    public static of<T>(func: () => T | Promise<T>): Try<T>{
        return new Try([()=> of(func)]);
    }

    static combine<T extends any[], R>(...args: [...{ [K in keyof T]: Try<T[K]> }, (...values: T) => R | Promise<R>]): Try<R> {
        // @ts-ignore
        return new Try([()=> combine(...args)]);
    }

    public static success<U>(value:U): Try<U> {
        return new Try([()=> success(value)]);
    }

    public static failure<T>(err: Error): Try<T> {
        return new Try([()=> failure(err)]);
    }

    public map<U>(func: (value: T) => U | Promise<U>): Try<U> {
        return new Try([...this.steps, (prev: Result)=> map(prev, func)])
    }

    public mapIf<U>(predicateFunc: (value: T) => boolean | Promise<boolean>, func: (value: T) => U | Promise<U>): Try<U>{
        return new Try([...this.steps, (prev: Result)=> mapIf(prev, predicateFunc, func)])
    }

    public mapFailureWith<E extends Error, U extends Error>(errorType: new (...args: any[]) => E, func: (ex: E) => U | Promise<U>): Try<T>{
        return new Try([...this.steps, (prev: Result)=> mapFailureWith(prev, errorType, func)])
    }

    public flatMap<U>(func: (value: T) => Try<U> | Promise<Try<U>>): Try<U> {
        return new Try([...this.steps, (prev: Result)=> flatMap(prev, func)])
    }

    public flatMapIf<U>(predicateFunc: (value: T) => boolean | Promise<boolean>, func: (value: T) => Try<U> | Promise<Try<U>>): Try<U>{
        return new Try([...this.steps, (prev: Result)=> flatMapIf(prev, predicateFunc, func)])
    }

    public async getOrElse<U>(fallbackValue: U): Promise<U | T>{
        return getOrElse(this, fallbackValue);
    }

    public async getOrElseGet<U>(func: (ex: Error) => U | Promise<U>): Promise<T | U> {
        return getOrElseGet(this, func)
    }

    public async getOrElseThrow(func: (error: Error) => Promise<Error> | Error): Promise<T>{
        return getOrElseThrow(this, func)
    }

    public peek(func: (value: T) => Promise<void> | void): Try<T>{
        //According to the docs, peek is the same as `andThen`
        return new Try([...this.steps, (prev: Result)=> andThen(prev, func)])
    }

    public andThen(func: (value: T) => Promise<void> | void): Try<T>{
        return new Try([...this.steps, (prev: Result)=> andThen(prev, func)])
    }

    public filter(predicateFunc: (value: T) => boolean | Promise<boolean>, errorProvider?: (value: T) => Error): Try<T>{
        return new Try([...this.steps, (prev: Result)=> filter(prev, predicateFunc, errorProvider)])
    }

    public filterNot(predicateFunc: (value: T) => boolean | Promise<boolean>, errorProvider?: (value: T) => Error): Try<T>{
        return new Try([...this.steps, (prev: Result)=> filterNot(prev, predicateFunc, errorProvider)])
    }

    public recover<U>(func: (error: Error) => U | Promise<U>): Try<T | U>{
        return new Try([...this.steps, (prev: Result)=> recover(prev, func)])
    }

    public recoverWith<U>(func: (error: Error) => Try<U> | Promise<Try<U>>): Try<U | T>{
        return new Try([...this.steps, (prev: Result)=> recoverWith(prev, func)])
    }

    public async get(): Promise<T> {
        return get(this);
    }

    public async run(): Promise<Try<T>>{
        await run(this);
        return this;
    }

    public isSuccess(): boolean {
        return !this._finalResult!.isError();
    }

    public isFailure(): boolean {
        return this._finalResult!.isError();
    }

    public andFinally(func: () => Promise<void> | void): Try<T> {
        return new Try([...this.steps, (prev: Result)=> andFinally(prev, func)])
    }

    public mapFailure(func: (ex: Error) => Error | Promise<Error>): Try<T>{
        return new Try([...this.steps, (prev: Result)=> mapFailure(prev, func)])
    }

    public getCause(): Error | undefined {
        return this._finalResult!.getError()
    }

    public onSuccess(func: (value: T) => Promise<void> | void): Try<T>{
        return new Try([...this.steps, (prev: Result)=> onSuccess(prev, func)])
    }

    public onFailure(func: (value: Error) => Promise<void> | void): Try<T>{
        return new Try([...this.steps, (prev: Result)=> onFailure(prev, func)])
    }

}