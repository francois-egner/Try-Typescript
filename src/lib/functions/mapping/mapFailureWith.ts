import {Result} from "../../Result";


export async function mapFailureWith<E extends Error, U extends Error>(prev: Result, errorType: new (...args: any[]) => E, func: (ex: E) => U | Promise<U>): Promise<Result>{
    if(!prev.isError())
        return prev

    try{
        if (errorType.name === prev.getError()!.name){
            // @ts-ignore
            return prev.setError(await func(prev.getError()!))
        }

    }catch(err: unknown){
        throw err as Error;
    }
    return prev
}