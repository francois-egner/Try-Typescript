const TryFunctions = {
    MAP: 'MAP',
    ANDTHEN: 'ANDTHEN'
};

type ExecutionElement = {name: string, func: Function, returning: boolean};

export class Try {
    private constructor() {}

    private value: any;
    private executionStack: ExecutionElement[] = [];
    private errorStack?: Error;


    //Static methods to create a Try object
    static success(value: any): Try {
        return new Try().setValue(value);
    }

    static failure(error: Error): Try {
        return new Try().setError(error);
    }

    static of(fn: () => any): Try {
        return new Try().addExecution({func: fn, returning: true});
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

    private addExecution(fn: any): Try{
        this.executionStack.push(fn);
        return this;
    }

    private async runElement(executionElement: ExecutionElement, isFirst: boolean = false){
        try {
            if(isFirst && executionElement.returning){
                this.value = await executionElement.func();
                return;
            }

            if(executionElement.returning){
                this.value = await executionElement.func(this.value);
                return;
            }
            await executionElement.func(this.value);
        } catch (e) {
            // @ts-ignore
            this.errorStack = e;
        }
    }

    private async runExecutionStack(){
        for (let i = 0; i < this.executionStack.length; i++) {
            const executionElement = this.executionStack[i];

            switch(executionElement.name){
                case TryFunctions.MAP: {
                    if(this.isSuccess())
                        await this.runElement(executionElement, i === 0);
                    break;
                }
                case TryFunctions.ANDTHEN: {
                    if(this.isSuccess())
                        await this.runElement(executionElement, i === 0);
                    break;
                }
                default: {
                    //This will typically run one of the static methods
                    await this.runElement(executionElement, i === 0);
                }
            }
        }
    }




    //----- Public interface -----

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
        this.executionStack.push({name: TryFunctions.MAP, func: fn, returning: true});
        return this;

    }



    public andThen(fn: (value: any) => any): Try {
        this.executionStack.push({name: TryFunctions.ANDTHEN, func: fn, returning: false});
        return this;
    }

    public isSuccess(): boolean {
        return this.errorStack === undefined;
    }

    public isFailure(): boolean {
        return this.errorStack !== undefined;
    }

    public getCause(): Error | undefined {
        return this.errorStack;
    }



}