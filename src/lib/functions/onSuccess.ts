import {Result} from "../Result";


export async function onSuccess(prev: Result, func: (v: any) => Promise<void> | void): Promise<Result>{
    if(prev.isError())
        return prev;

    try{
        await func(prev.getValue())
    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}