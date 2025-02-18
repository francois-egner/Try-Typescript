import {Result} from "../../Result";
import {runInTry} from "../helpers";


export async function of(func: () => any): Promise<Result> {
    const result = new Result();
    await runInTry(async ()=>{
        result.setValue(await func());
    }, result);

    return result;
}