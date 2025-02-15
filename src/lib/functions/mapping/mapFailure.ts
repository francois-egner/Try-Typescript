import {Result} from "../../Result";


export async function mapFailure(prev: Result, func: (v: Error)=> Error | Promise<Error>): Promise<Result>{
    if(!prev.isError())
        return prev

    try{
        prev.setError(await func(prev.getError()!))
    }catch(err: unknown){
        throw err as Error;
    }

    return prev;

}