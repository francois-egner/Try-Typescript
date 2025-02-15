import {Result} from "../../Result";
import {Try} from "../../Try";


export async function flatMap(prev: Result, func: (value: any) => Try<any> | Promise<Try<any>>): Promise<Result>{
    if(prev.isError())
        return prev

    try{
        const tryObject = await func(prev.getValue())
        prev.setValue(await tryObject.get())
    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}