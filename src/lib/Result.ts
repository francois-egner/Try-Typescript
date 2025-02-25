export class Result {
    private value: any | undefined;
    private error: Error | undefined;

    constructor() {
        this.value = undefined;
        this.error = undefined;
    }

    public setValue(value: any | undefined): Result {this.value = value; return this;}
    public getValue(): any | undefined {return this.value;}
    public setError(error: any | undefined): Result {this.error = error; return this;}
    public getError(): Error | undefined {return this.error;}
    public isError(): boolean {return this.error != undefined;}
    public hasvalue(): boolean {return this.error == undefined;}
}