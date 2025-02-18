import {Result} from "../../Result";
import {runInTry} from "../helpers";


export async function recover(prev: Result, func: (err: Error) => any): Promise<Result>{
    if(!prev.isError())
        return prev;

    await runInTry(async ()=>{
        prev.setValue(await func(prev.getError()!));
        prev.setError(undefined);
    }, prev);

    return prev;

}