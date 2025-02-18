import {Result} from "../../Result";
import {runInTry} from "../helpers";


export async function onFailure(prev: Result, func: (v: Error) => Promise<void> | void): Promise<Result>{
    if(!prev.isError())
        return prev;

    await runInTry(async ()=>{
        await func(prev.getError()!);
    }, prev);

    return prev;

}