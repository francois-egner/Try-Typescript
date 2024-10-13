import { Try } from "./Try";

export class Failure<T> extends Try<T> {
    private readonly err: Error;

    constructor(err: Error) {
        super();
        this.err = err;
    }

    public get(): T {
        throw this.err;
    }

    public getCause(): Error {
        return this.err;
    }

    public isEmpty(): boolean {
        return false;
    }

    public isFailure(): boolean {
        return true;
    }

    public isSuccess(): boolean {
        return false;
    }

    public stringPrefix(): string {
        return "Failure";
    }

    public toString(): string {
        return this.stringPrefix() + "(" + this.err + ")";
    }
}

// Register the factory
Try.failureFactory = <T>(err: Error) => new Failure(err);