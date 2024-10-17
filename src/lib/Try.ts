import {NoSuchElementException} from "../exceptions/NoSuchElementException";

const TryFunctions = {
    OF: "OF",
    MAP: 'MAP',
    ANDTHEN: 'ANDTHEN',
    FLATMAP: 'FLATMAP',
    FILTER: 'FILTER',
    FILTERNOT: 'FILTERNOT',
    PEEK: 'PEEK',
    RECOVER: 'RECOVER',
    RECOVERWITH: 'RECOVERWITH',
    ONSUCCESS: 'ONSUCCESS',
    ONFAILURE: 'ONFAILURE',

};

type ExecutionElement = {name: string, functionData: {func: Function, fallbackFunction?: Function}, returning: boolean};

export class Try<T> {
    private value: any;
    private executionStack: ExecutionElement[] = [];
    private errorStack?: Error;

    private constructor(initExecution?: ExecutionElement) {
        if(initExecution)
            this.executionStack.push(initExecution);
    }


    //Static methods to create a Try object
    static success<T>(value: T): Try<T> {
        return new Try().setValue(value);
    }

    static failure<T>(error: Error): Try<T> {
        return new Try<T>().setError(error);
    }

    static of<T>(fn: () => T): Try<T> {
        return new Try<T>({
            name: TryFunctions.OF,
            functionData: {func: fn},
            returning: true}
        );
    }


    //Private methods to modify the internal state
    private setValue<T>(value: T): Try<T> {
        this.value = value;
        return this as unknown as Try<T>;
    }

    private setError(err: Error): Try<T> {
        this.errorStack = err;
        return this;
    }


    private async runElement(executionElement: ExecutionElement, isFirst: boolean = false): Promise<void>{
        try {
            if(isFirst && executionElement.returning){
                this.value = await executionElement.functionData.func();
                return;
            }

            if(executionElement.returning){
                this.value = await executionElement.functionData.func(this.value);
                return;
            }
            await executionElement.functionData.func(this.value);
        } catch (e) {
            this.errorStack = e as Error;
        }
    }


    private async runExecutionStack(): Promise<void>{
        for (let i = 0; i < this.executionStack.length; i++) {
            const executionElement = this.executionStack[i];
            try{
                switch(executionElement.name){
                    case TryFunctions.MAP: {
                        if(this.isSuccess())
                            await this.runElement(executionElement, executionElement.name === TryFunctions.OF);
                        break;
                    }
                    case TryFunctions.FLATMAP: {
                        if(this.isSuccess()){
                            const tryObject: Try<any> = await executionElement.functionData.func(this.value);
                            this.value = await tryObject.get();
                        }

                        break;
                    }
                    case TryFunctions.ANDTHEN: {
                        if(this.isSuccess())
                            await this.runElement(executionElement, executionElement.name === TryFunctions.OF);
                        break;
                    }
                    case TryFunctions.FILTER: {
                        if(this.isSuccess()){
                            if(!await executionElement.functionData.func(this.value)){
                                await executionElement.functionData.fallbackFunction!(this.value);
                            }
                        }
                        break;
                    }
                    case TryFunctions.FILTERNOT: {
                        if(this.isSuccess()){
                            if(await executionElement.functionData.func(this.value)){
                                await executionElement.functionData.fallbackFunction!(this.value);
                            }
                        }
                        break;
                    }
                    case TryFunctions.PEEK: {
                        if(this.isSuccess())
                            await executionElement.functionData.func(this.value);

                        break;
                    }
                    case TryFunctions.RECOVER: {
                        if(this.isFailure()){
                            this.errorStack = undefined;
                            this.value = await executionElement.functionData.func(this.errorStack!);
                        }
                        break;
                    }
                    case TryFunctions.RECOVERWITH: {
                        if(this.isFailure()){
                            this.errorStack = undefined;
                            const tryObject: Try<any> = await executionElement.functionData.func(this.errorStack!);
                            this.value = await tryObject.get();
                        }
                        break;
                    }
                    case TryFunctions.ONSUCCESS: {
                        if(this.isSuccess())
                            await executionElement.functionData.func(this.value);
                        break;
                    }
                    case TryFunctions.ONFAILURE: {
                        if(this.isFailure())
                            await executionElement.functionData.func(this.errorStack!);
                        break;
                    }
                    default: {
                        //This will typically run one of the static methods
                        await this.runElement(executionElement, executionElement.name === TryFunctions.OF);
                    }
                }
            }catch(ex){
                // @ts-ignore
                this.errorStack = ex;
            }

        }
    }




    //----- Public interface -----

    public async run(): Promise<Try<T>> {
        await this.runExecutionStack()
        return this;
    }

    public async get(): Promise<T> {
        await this.runExecutionStack()
        if (this.isFailure())
            throw this.errorStack;

        return this.value;
    }
    public async getOrElse<U>(defaultValue: U): Promise<U | T> {
        await this.runExecutionStack()
        return this.isFailure() ? defaultValue : this.value;
    }
    public async getOrElseGet<U>(fn: (ex: Error) => U): Promise<T | U> {
        await this.runExecutionStack()
        return this.isFailure() ? await fn(this.errorStack!) : this.value;

    }
    public async getOrElseThrow<U>(fn: (error: Error) => U): Promise<T | U> {
        await this.runExecutionStack()
        if (this.isFailure())
            throw fn(this.errorStack!);

        return this.value;
    }



    public map<U>(fn: (value: T) => U): Try<U> {
        this.executionStack.push({
            name: TryFunctions.MAP,
            functionData: {func: fn},
            returning: true
        });
        return this as unknown as Try<U>;
    }
    public flatMap<U>(fn: (value: T) => Try<U>) : Try<U> {
        this.executionStack.push({
            name: TryFunctions.FLATMAP,
            functionData: {func: fn},
            returning: true
        });
        return this as unknown as Try<U>;
    }


    public filter(predicateFunc: (value: T) => boolean, throwbackFunction?: (value: T) => void): Try<T> {
        this.executionStack.push({
            name: TryFunctions.FILTER,
            functionData: {func: predicateFunc, fallbackFunction: throwbackFunction ?? ((value: any) => {throw new NoSuchElementException(`Predicate does not hold for ${value}`)}) },
            returning: false
        });
        return this;
    }
    public filterNot(predicateFunc: (value: T) => boolean, throwbackFunction?: (value: T) => void): Try<T> {
        this.executionStack.push({
            name: TryFunctions.FILTERNOT,
            functionData: {func: predicateFunc, fallbackFunction: throwbackFunction ?? ((value: T) => {throw new NoSuchElementException(`Predicate does not hold for ${value}`)}) },
            returning: false
        });
        return this;
    }

    public peek(fn: (value: T) => void): Try<T> {
        this.executionStack.push({
            name: TryFunctions.PEEK,
            functionData: {func: fn},
            returning: false}
        );
        return this;
    }

    public andThen(fn: (value: T) => any): Try<T> {
        this.executionStack.push({
            name: TryFunctions.ANDTHEN,
            functionData: {func: fn},
            returning: false}
        );
        return this;
    }

    public recover<U>(fn: (error: Error) => U): Try<T | U> {
        this.executionStack.push({
            name: TryFunctions.RECOVER,
            functionData: {func: fn},
            returning: true
        });
        return this;
    }
    public recoverWith<U>(fn: (error: Error) => Try<U>): Try<U | T> {
        this.executionStack.push({
            name: TryFunctions.RECOVERWITH,
            functionData: {func: fn},
            returning: true
        });
        return this as unknown as Try<U | T>;
    }

    public isSuccess(): boolean {
        return this.errorStack === undefined;
    }
    public isFailure(): boolean {
        return this.errorStack !== undefined;
    }

    public onSuccess(fn: (value: T) => void): Try<T> {
        this.executionStack.push({
            name: TryFunctions.ONSUCCESS,
            functionData: {func: fn},
            returning: false
        });
        return this;
    }
    public onFailure(fn: (ex: Error) => void): Try<T> {
        this.executionStack.push({
            name: TryFunctions.ONFAILURE,
            functionData: {func: fn},
            returning: false
        });
        return this;
    }

    public getCause(): Error | undefined {
        return this.errorStack;
    }



}