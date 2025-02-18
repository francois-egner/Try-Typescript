import {Result} from "../../Result";
import {Try} from "../../Try";
import {runInTry} from "../helpers";


export async function flatMap(prev: Result, func: (value: any) => Try<any> | Promise<Try<any>>): Promise<Result>{
    if(prev.isError())
        return prev;

    await runInTry(async ()=>{
        const tryObject = await func(prev.getValue());
        prev.setValue(await tryObject.get());
    }, prev);
    return prev;

}