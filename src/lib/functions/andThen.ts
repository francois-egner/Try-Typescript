import {Result} from "../Result";


export async function andThen(prev: Result, func: (v: any)=> void): Promise<Result>{
    if(prev.isError())
        return prev

    try{
        await func(prev.getValue())
    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}