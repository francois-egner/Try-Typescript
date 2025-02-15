import {Result} from "../../Result";
import {Try} from "../../Try";


export async function recoverWith(prev: Result, func: (err: Error) => Try<any> | Promise<Try<any>>): Promise<Result>{
    if(!prev.isError())
        return prev

    try{
        const tryObject = await func(prev.getError()!)
        prev.setValue(await tryObject.get())
        prev.setError(undefined);
    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}