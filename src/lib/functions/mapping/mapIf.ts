import {Result} from "../../Result";
import {runInTry} from "../helpers";


export async function mapIf(prev: Result, predicate: (v: any) => Promise<boolean> | boolean,func: (v: any)=> any): Promise<Result>{

    await runInTry(async () => {
        if(prev.isError() || !(await predicate(prev.getValue())))
            return prev;

        prev.setValue(await func(prev.getValue()));
    }, prev);

    return prev;

}