import {Result} from "../../Result";
import {runInTry} from "../helpers";


export async function andThen(prev: Result, func: (v: any)=> Promise<void> | void): Promise<Result>{
    if(prev.isError())
        return prev;

    await runInTry(async ()=>{
        await func(prev.getValue());
    }, prev);

    return prev;

}