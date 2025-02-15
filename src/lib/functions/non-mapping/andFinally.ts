import {Result} from "../../Result";


export async function andFinally(prev: Result, func: (v: any) => Promise<void> | void): Promise<Result>{
    try{
        await func(prev.getValue())
    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}