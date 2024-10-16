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

export class Try {
    private value: any;
    private executionStack: ExecutionElement[] = [];
    private errorStack?: Error;

    private constructor(initExecution?: ExecutionElement) {
        if(initExecution)
            this.executionStack.push(initExecution);
    }


    //Static methods to create a Try object
    static success(value: any): Try {
        return new Try().setValue(value);
    }

    static failure(error: Error): Try {
        return new Try().setError(error);
    }

    static of(fn: () => any): Try {
        return new Try({
            name: TryFunctions.OF,
            functionData: {func: fn},
            returning: true}
        );
    }


    //Private methods to modify the internal state
    private setValue(value: any): Try {
        this.value = value;
        return this;
    }

    private setError(err: Error): Try {
        this.errorStack = err;
        return this;
    }


    private async runElement(executionElement: ExecutionElement, isFirst: boolean = false){
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
            // @ts-ignore
            this.errorStack = e;
        }
    }


    private async runExecutionStack(){
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
                            const tryObject: Try = await executionElement.functionData.func(this.value);
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
                            const tryObject: Try = await executionElement.functionData.func(this.errorStack!);
                            this.value = await tryObject.get();
                        }
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

    public async run(): Promise<Try> {
        await this.runExecutionStack()
        return this;
    }

    public async get(): Promise<any> {
        await this.runExecutionStack()
        if (this.isFailure())
            throw this.errorStack;

        return this.value;
    }
    public async getOrElse<U>(defaultValue: U): Promise<U | any> {
        await this.runExecutionStack()
        return this.isFailure() ? defaultValue : this.value;
    }
    public async getOrElseGet<U>(fn: (ex: Error) => U): Promise<U> {
        await this.runExecutionStack()
        return this.isFailure() ? await fn(this.errorStack!) : this.value;

    }
    public async getOrElseThrow<U>(fn: (error: Error) => U): Promise<any> {
        await this.runExecutionStack()
        if (this.isFailure())
            throw fn(this.errorStack!);

        return this.value;
    }



    public map(fn: (value: any) => any): Try {
        this.executionStack.push({
            name: TryFunctions.MAP,
            functionData: {func: fn},
            returning: true
        });
        return this;
    }
    public flatMap(fn: (value: any) => Try) : Try {
        this.executionStack.push({
            name: TryFunctions.FLATMAP,
            functionData: {func: fn},
            returning: true
        });
        return this
    }


    public filter(predicateFunc: (value: any) => boolean, throwbackFunction?: (value: any) => void): Try {
        this.executionStack.push({
            name: TryFunctions.FILTER,
            functionData: {func: predicateFunc, fallbackFunction: throwbackFunction ?? ((value: any) => {throw new NoSuchElementException(`Predicate does not hold for ${value}`)}) },
            returning: false
        });
        return this;
    }
    public filterNot(predicateFunc: (value: any) => boolean, throwbackFunction?: (value: any) => void): Try {
        this.executionStack.push({
            name: TryFunctions.FILTERNOT,
            functionData: {func: predicateFunc, fallbackFunction: throwbackFunction ?? ((value: any) => {throw new NoSuchElementException(`Predicate does not hold for ${value}`)}) },
            returning: false
        });
        return this;
    }

    public peek(fn: (value: any) => void): Try {
        this.executionStack.push({
            name: TryFunctions.PEEK,
            functionData: {func: fn},
            returning: false}
        );
        return this;
    }

    public andThen(fn: (value: any) => any): Try {
        this.executionStack.push({
            name: TryFunctions.ANDTHEN,
            functionData: {func: fn},
            returning: false}
        );
        return this;
    }

    public recover(fn: (error: Error) => any): Try {
        this.executionStack.push({
            name: TryFunctions.RECOVER,
            functionData: {func: fn},
            returning: true
        });
        return this;
    }
    public recoverWith(fn: (error: Error) => Try): Try {
        this.executionStack.push({
            name: TryFunctions.RECOVERWITH,
            functionData: {func: fn},
            returning: true
        });
        return this;
    }

    public isSuccess(): boolean {
        return this.errorStack === undefined;
    }
    public isFailure(): boolean {
        return this.errorStack !== undefined;
    }

    public onSuccess(fn: (value: any) => void): Try {
        this.executionStack.push({
            name: TryFunctions.ONSUCCESS,
            functionData: {func: fn},
            returning: false
        });
        return this;
    }
    public onFailure(fn: (value: any) => void): Try {
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