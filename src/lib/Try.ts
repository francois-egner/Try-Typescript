import type { Success } from "./Success";
import type { Failure } from "./Failure";
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

    public map<U>(f: (v: T) => U): Try<U> {
        if(this.isFailure())
            return this as unknown as Try<U>;
        try{
            const value = (this as unknown as Success<T>).get();
            return Try.success(f(value));
        }catch (e: any){
            return Try.failure(e);
        }
    }
    public flatMap<U>(f: (v: T) => Try<U>): Try<U> {
        if(this.isFailure())
            return this as unknown as Try<U>;
        try{
            const value = (this as unknown as Success<T>).get();
            return f(value);
        }catch (e: any){
            return Try.failure(e);
        }
    }


    public static of<U>(f: () => U): Try<U> {
        try {
            return Try.success(f());
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
    public getOrElseGet<U>(fallbackFunction: (ex: Error) => U): T | U {
        return this.isSuccess() ? this.get() : fallbackFunction(this.getCause());
    }
    public getOrElseThrow<Error>(fallbackFunction: () => Error): T {
        if (this.isSuccess()) return this.get();
        throw Error
    }

    public andThen(f: (v: T) => void): Try<T> {
       if(this.isFailure()) return this;
       try{
            f(this.get());
            return this;
       }catch(ex){
           return Try.failure(ex as Error);
       }
    }

    public filter(predicate: (v: T) => boolean, fallbackFunction?: () => Error): Try<T> {
        if (this.isFailure()) return this;
        try {
            const value = (this as unknown as Success<T>).get();
            if (predicate(value)) return this;
            return Try.failure(fallbackFunction ? fallbackFunction() : new NoSuchElementException("Predicate does not hold for " + value));

        } catch (e: any) {
            return Try.failure(e);
        }
    }
    public filterNot(predicate: (v: T) => boolean, fallbackFunction?: () => Error): Try<T> {
        return this.filter(v => !predicate(v), fallbackFunction);
    }


    public peek(f: (v: T) => void): Try<T> {
        if(this.isSuccess()) f(this.get());
        return this;
    }


    public recover<U>(recoverMapping: { [key: string]: U }): Try< U | T> {
        if (this.isSuccess()) return this;
        const recoverValue = recoverMapping[this.getCause().constructor.name];
        return recoverValue ? Try.success(recoverValue) : this;
    }
    public recoverWith<U>(recoverMapping: { [key: string]: (ex: Error) => U }): Try<T>;
    public recoverWith<U>(recoverMapping: { [key: string]: (ex: Error) => U }): Try<U>;
    public recoverWith<U>(recoverMapping: { [key: string]: (ex: Error) => U }): Try<U | T> {
        if (this.isSuccess()) return this as unknown as Try<T>;
        const recoverFunction = recoverMapping[this.getCause().constructor.name];
        return recoverFunction ? Try.of(()=> {return recoverFunction(this.getCause())}) as unknown as Try<U> : this as unknown as Try<T>;
    }


    public onSuccess(f: (v: T) => void): Try<T> {
        if(this.isSuccess()) f(this.get());
        return this;
    }
    public onFailure(f: (ex: Error) => void): Try<T> {
        if(this.isFailure()) f(this.getCause());
        return this;
    }


}