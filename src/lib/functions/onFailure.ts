import {Result} from "../Result";


export async function onFailure(prev: Result, func: (v: Error) => Promise<void> | void): Promise<Result>{
    if(!prev.isError())
        return prev;

    try{
        await func(prev.getError()!)
    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}