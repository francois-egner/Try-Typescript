import {Result} from "../../Result";
import {Try} from "../../Try";

export async function flatMapIf(prev: Result, predicate: (v: any) => Promise<boolean> | boolean, func: (value: any) => Try<any> | Promise<Try<any>>): Promise<Result>{
    if(prev.isError() || !(await predicate(prev.getValue())))
        return prev

    try{
        const tryObject = await func(prev.getValue())
        prev.setValue(await tryObject.get())
    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}