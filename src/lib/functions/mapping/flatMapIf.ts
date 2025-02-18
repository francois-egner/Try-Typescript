import {Result} from "../../Result";
import {Try} from "../../Try";
import {runInTry} from "../helpers";

export async function flatMapIf(prev: Result, predicate: (v: any) => Promise<boolean> | boolean, func: (value: any) => Try<any> | Promise<Try<any>>): Promise<Result>{
    await runInTry(async ()=>{
        if(prev.isError() || !(await predicate(prev.getValue())))
            return prev;

        const tryObject = await func(prev.getValue());
        prev.setValue(await tryObject.get());
    }, prev);

    return prev;

}