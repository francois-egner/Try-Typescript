import {Result} from "../../Result";


export async function recover(prev: Result, func: (err: Error) => any): Promise<Result>{
    if(!prev.isError())
        return prev

    try{
        prev.setValue(await func(prev.getError()!))
        prev.setError(undefined);
    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}