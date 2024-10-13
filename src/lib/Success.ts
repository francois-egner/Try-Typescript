import { Try } from "./Try";

export class Success<T> extends Try<T> {
    private readonly value: T;

    constructor(value: T) {
        super();
        this.value = value;
    }

    public get(): T {
        return this.value;
    }

    public getCause(): Error {
        throw new Error("Success.getCause");
    }


    public isEmpty(): boolean {
        return false;
    }

    public isFailure(): boolean {
        return false;
    }

    public isSuccess(): boolean {
        return true;
    }

    public stringPrefix(): string {
        return "Success";
    }

    public toString(): string {
        return this.stringPrefix() + "(" + this.value + ")";
    }
}

// Register the factory
Try.successFactory = <T>(value: T) => new Success(value);