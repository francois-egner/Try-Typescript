import {Result} from "../../Result";
import {runInTry} from "../helpers";


export async function map(prev: Result, func: (v: any)=> any): Promise<Result>{
    if(prev.isError())
        return prev;

    await runInTry(async () => {
        prev.setValue(await func(prev.getValue()));
    }, prev);

    return prev;

}