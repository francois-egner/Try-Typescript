import type { Success } from "./Success";
import type {Failure} from "./Failure";

export  abstract  class Try<T> {
    public Try() {
    }

    static success<T>(value: T): Try<T> {
        const SuccessClass = require("./Success").Success as { new (value: T): Success<T> };
        return new SuccessClass(value);
    }

    static failure<T>(ex: Error): Try<T> {
        const FailureClass = require("./Failure").Failure as { new (value: Error): Failure<any> };
        return new FailureClass(ex);
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

    public static of<U>(f: () => U): Try<U> {
        try {
            return Try.success(f());
        } catch (e: any) {
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

    public abstract isSuccess(): boolean;

    public abstract isFailure(): boolean;

    public abstract get(): T;
}