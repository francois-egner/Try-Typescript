import type {Success} from "./Success";
import {NoSuchElementException} from "../exceptions/NoSuchElementException";


export  abstract  class Try<T> {

    protected constructor() {}

    static successFactory: <T>(value: T) => Try<T>;
    static failureFactory: <T>(ex: Error) => Try<T>;

    static success<T>(value: T): Try<T> {
        return Try.successFactory(value);
    }
    static failure<T>(ex: Error): Try<T> {
       return Try.failureFactory(ex);
    }

    public async map<U>(f: (v: T) => Promise<U> | U): Promise<Try<U>> {
        if (this.isFailure()) {
            return this as unknown as Try<U>;
        }
        try {
            const value = (this as unknown as Success<T>).get();
            const result = await f(value);
            return Try.success(result);
        } catch (e: any) {
            return Try.failure(e);
        }
    }
    public async flatMap<U>(f: (v: T) => Promise<Try<U>> | Try<U>): Promise<Try<U>> {
        if (this.isFailure()) {
            return this as unknown as Try<U>;
        }
        try {
            const value = (this as unknown as Success<T>).get();
            return await f(value);
        } catch (e: any) {
            return Try.failure(e);
        }
    }


    public static async of<U>(f: () => Promise<U> | U):Promise<Try<U>> {
        try {
            const result = await f();
            return Try.success(result);
        } catch (e: any) {
            return Try.failure(e);
        }
    }



    public abstract getCause(): Error;


    public abstract isSuccess(): boolean;
    public abstract isFailure(): boolean;



    public abstract get(): T;
    public getOrElse<U>(fallbackValue: U): T | U {
        return this.isSuccess() ? this.get() : fallbackValue;
    }
    public async getOrElseGet<U>(fallbackFunction: (ex: Error) => Promise<U> | U): Promise<T | U> {
        return this.isSuccess() ? this.get() : await fallbackFunction(this.getCause());
    }
    public async getOrElseThrow<Error>(fallbackFunction: () => Promise<Error> | Error): Promise<T> {
        if (this.isSuccess()) return this.get();
        throw await fallbackFunction();
    }

    public async andThen(f: (v: T) => Promise<void> | void): Promise<Try<T>> {
       if(this.isFailure()) return this;
       try{
            await f(this.get());
            return this;
       }catch(ex){
           return Try.failure(ex as Error);
       }
    }

    public async filter(predicate: (v: T) => Promise<boolean> | boolean, fallbackFunction?: () => Promise<Error> | Error): Promise<Try<T>> {
        if (this.isFailure()) return this;
        try {
            const value = (this as unknown as Success<T>).get();
            if (await predicate(value)) return this;
            return Try.failure(fallbackFunction ? await fallbackFunction() : new NoSuchElementException("Predicate does not hold for " + value));

        } catch (e: any) {
            return Try.failure(e);
        }
    }
    public async filterNot(predicate: (v: T) => Promise<boolean> | boolean, fallbackFunction?: () => Promise<Error> | Error): Promise<Try<T>> {
        return this.filter(v => !predicate(v), fallbackFunction);
    }


    public async peek(f: (v: T) => Promise<void> | void): Promise<Try<T>> {
        if (this.isSuccess()) await f(this.get());
        return this;
    }


    public async recover<U>(recoverMapping: { [key: string]: Promise<U> | U }): Promise<Try<U | T>> {
        if (this.isSuccess()) return this;
        const recoverValue = recoverMapping[this.getCause().constructor.name];
        return recoverValue ? Try.success(await recoverValue) : this;
    }
    public async recoverWith<U>(recoverMapping: { [key: string]: (ex: Error) => Promise<U> | U }): Promise<Try< T>>
    public async recoverWith<U>(recoverMapping: { [key: string]: (ex: Error) => Promise<U> | U }): Promise<Try<U>>
    public async recoverWith<U>(recoverMapping: { [key: string]: (ex: Error) => Promise<U> | U }): Promise<Try<U | T>> {
        if (this.isSuccess()) return this as unknown as Try<T>;
        const recoverFunction = recoverMapping[this.getCause().constructor.name];
        return recoverFunction ? await Try.of(() => recoverFunction(this.getCause())) as unknown as Promise<Try<U>> : this as unknown as Promise<Try<T>>;
    }


    public async onSuccess(f: (v: T) => Promise<void> | void): Promise<Try<T>> {
        if (this.isSuccess()) await f(this.get());
        return this;
    }

    public async onFailure(f: (ex: Error) => Promise<void> | void): Promise<Try<T>> {
        if (this.isFailure()) await f(this.getCause());
        return this;
    }


}