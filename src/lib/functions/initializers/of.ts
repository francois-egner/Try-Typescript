import {Result} from "../../Result";


export async function of(func: () => any): Promise<Result> {
    try{
        return new Result().setValue(await func());
    }catch(err: unknown){
        return new Result().setError(err as Error);
    }
}