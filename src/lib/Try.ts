import {NoSuchElementException} from "../exceptions/NoSuchElementException";

const TryFunctions = {
    OF: "OF",
    COMBINE: 'COMBINE',
    MAP: 'MAP',
    ANDTHEN: 'ANDTHEN',
    ANDFINALLY: 'ANDFINALLY',
    FLATMAP: 'FLATMAP',
    FILTER: 'FILTER',
    FILTERNOT: 'FILTERNOT',
    PEEK: 'PEEK',
    RECOVER: 'RECOVER',
    RECOVERWITH: 'RECOVERWITH',
    ONSUCCESS: 'ONSUCCESS',
    ONFAILURE: 'ONFAILURE',
    MAPFAILURE: 'MAPFAILURE',
    MAPFAILUREWITH: 'MAPFAILUREWITH'

};

type ExecutionElement = {name: string, functionData: {func: Function, fallbackFunction?: Function, trys?: Try<any>[],newErrorType?: new (...args: any[]) => Error, args?: any[],  errorType?: new (...args: any[]) => Error}, returning: boolean};


export class Try<T> {
    private value: any;
    private executionStack: ExecutionElement[] = [];
    private internalError?: Error;

    private constructor(initExecution?: ExecutionElement) {
        if(initExecution)
            this.executionStack.push(initExecution);
    }

    static combine<T extends any[], R>(...args: [...{ [K in keyof T]: Try<T[K]> }, (...values: T) => R]): Try<R> {
        const trys = args.slice(0, -1) as { [K in keyof T]: Try<T[K]> };
        const func = args[args.length - 1] as (...values: T) => R;

        return new Try<R>({
            name: TryFunctions.COMBINE,
            functionData: { func: () => func(...trys.map(tryObj => tryObj.value) as T), trys },
            returning: true
        });
    }


    //Static methods to create a Try object
    static success<T>(value: T): Try<T> {
        return new Try().setValue(value);
    }

    static failure<T>(error: Error): Try<T> {
        return new Try<T>().setError(error);
    }

    static of<T>(fn: () => T| Promise<T>): Try<Awaited<T>> {
        return new Try<Awaited<T>>({
            name: TryFunctions.OF,
            functionData: {func: fn},
            returning: true
        });
    }


    //Private methods to modify the internal state
    private setValue<T>(value: T): Try<T> {
        this.value = value;
        return this as unknown as Try<T>;
    }

    private setError(err: Error): Try<T> {
        this.internalError = err;
        return this;
    }


    private async executeElement(executionElement: ExecutionElement): Promise<void>{

        if(executionElement.returning){
            return this.value = executionElement.name === TryFunctions.OF
                ? await executionElement.functionData.func()
                : await executionElement.functionData.func(this.value)
        }

        await executionElement.functionData.func(this.value);

    }


    private async runExecutionStack(): Promise<void>{
        for(const executionElement of this.executionStack){
            try{
                if(executionElement.name === TryFunctions.MAP){
                    if(this.isSuccess())
                        await this.executeElement(executionElement);
                }

                else if(executionElement.name === TryFunctions.FLATMAP){
                    if(this.isSuccess()){
                        const tryObject: Try<any> = await executionElement.functionData.func(this.value);
                        this.value = await tryObject.get();
                    }
                }

                else if(executionElement.name === TryFunctions.ANDTHEN){
                    if(this.isSuccess())
                        await this.executeElement(executionElement);
                }

                else if(executionElement.name === TryFunctions.ANDFINALLY){
                    await this.executeElement(executionElement);
                }

                else if(executionElement.name === TryFunctions.FILTER){
                    if(this.isSuccess()){
                        if(await executionElement.functionData.func(this.value)){
                            await executionElement.functionData.fallbackFunction!(this.value);
                        }
                    }
                }

                else if(executionElement.name === TryFunctions.FILTERNOT){
                    if(this.isSuccess()){
                        if(!await executionElement.functionData.func(this.value)){
                            await executionElement.functionData.fallbackFunction!(this.value);
                        }
                    }
                }

                else if(executionElement.name === TryFunctions.PEEK){
                    if(this.isSuccess())
                        await executionElement.functionData.func(this.value);
                }

                else if(executionElement.name === TryFunctions.RECOVER){
                    if(this.isFailure()){
                        this.value = await executionElement.functionData.func(this.internalError!);
                        this.internalError = undefined;
                    }
                }

                else if(executionElement.name === TryFunctions.RECOVERWITH){
                    if(this.isFailure()){
                        const tryObject: Try<any> = await executionElement.functionData.func(this.internalError!);
                        this.internalError = undefined;
                        this.value = await tryObject.get();
                    }
                }

                else if (executionElement.name === TryFunctions.ONSUCCESS){
                    if(this.isSuccess())
                        await executionElement.functionData.func(this.value);
                }

                else if (executionElement.name === TryFunctions.ONFAILURE){
                    if(this.isFailure())
                        await executionElement.functionData.func(this.internalError!);
                }

                else if (executionElement.name === TryFunctions.COMBINE){
                    const values = await Promise.all(executionElement.functionData.trys!.map(async tryObject => await tryObject.run()));
                    for(const v of values){
                        if(v.isFailure()){
                            this.internalError = v.internalError;
                            break;
                        }
                    }
                    this.value = await executionElement.functionData.func(...values);
                }

                else if (executionElement.name === TryFunctions.MAPFAILURE){
                    if(this.isFailure()){
                            this.internalError = await executionElement.functionData.func(this.internalError);
                    }
                }
                else if (executionElement.name === TryFunctions.MAPFAILUREWITH){
                    if(this.isFailure() && this.internalError instanceof executionElement.functionData.errorType!){
                            this.internalError = await executionElement.functionData.func(this.internalError);
                    }
                }
                else {
                    await this.executeElement(executionElement);
                }
            }catch(ex: unknown){
                this.internalError = ex as Error;
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
            throw this.internalError;

        return this.value;
    }
    public async getOrElse<U>(defaultValue: U): Promise<U | T> {
        await this.runExecutionStack()
        return this.isFailure() ? defaultValue : this.value;
    }
    public async getOrElseGet<U>(fn: (ex: Error) => U): Promise<T | U> {
        await this.runExecutionStack()
        return this.isFailure() ? await fn(this.internalError!) : this.value;

    }
    public async getOrElseThrow<U>(fn: (error: Error) => U): Promise<T | U> {
        await this.runExecutionStack()
        if (this.isFailure())
            throw fn(this.internalError!);

        return this.value;
    }



    public map<U>(fn: (value: T) => U): Try<Awaited<U>> {
        this.executionStack.push({
            name: TryFunctions.MAP,
            functionData: {func: fn},
            returning: true
        });
        return this as unknown as Try<Awaited<U>>;
    }
    public flatMap<U>(fn: (value: T) => Try<U> | Promise<Try<U>>): Try<Awaited<U>> {
        this.executionStack.push({
            name: TryFunctions.FLATMAP,
            functionData: {func: fn},
            returning: true
        });
        return this as unknown as Try<Awaited<U>>;
    }

    public mapFailure<E extends Error, U extends Error>(func: (ex: E) => U | Promise<U>): Try<T> {
        this.executionStack.push({
            name: TryFunctions.MAPFAILURE,
            functionData: {func: func},
            returning: false
        });
        return this;
    }

    public mapFailureWith<E extends Error, U extends Error>(errorType: new (...args: any[]) => E, func: (ex: E) => U | Promise<U>): Try<T> {
        this.executionStack.push({
            name: TryFunctions.MAPFAILUREWITH,
            functionData: {func: func, errorType: errorType},
            returning: false
        });
        return this;
    }


    public filter(predicateFunc: (value: T) => boolean | Promise<boolean>, throwbackFunction?: (value: T) => void): Try<T> {
        this.executionStack.push({
            name: TryFunctions.FILTER,
            functionData: {func: predicateFunc, fallbackFunction: throwbackFunction ?? ((value: any) => {throw new NoSuchElementException(`Predicate does not hold for ${value}`)}) },
            returning: false
        });
        return this;
    }
    public filterNot(predicateFunc: (value: T) => boolean | Promise<boolean>, throwbackFunction?: (value: T) => void): Try<T> {
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

    public andFinally(fn: () => any): Try<T> {
        this.executionStack.push({
            name: TryFunctions.ANDFINALLY,
            functionData: {func: fn},
            returning: false
        })
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
        return this.internalError === undefined;
    }
    public isFailure(): boolean {
        return this.internalError !== undefined;
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

        return this.internalError;
    }

    

}