import {Result} from "../../Result";
import {Try} from "../../Try";
import {runInTry} from "../helpers";



export async function combine<T extends any[], R>(...args: [...{ [K in keyof T]: Try<T[K]> }, (...values: T) => R]): Promise<Result>{
    const result = new Result();
    const tries = args.slice(0, -1) as { [K in keyof T]: Try<T[K]> };
    const func = args[args.length - 1] as (...values: T) => R;
    const values: unknown[] = [];

    for(const v of tries){
        const success = await runInTry(async ()=>{
            values.push(await v.get());
        }, result);

        if(!success)
            return result;

    }

    //@ts-ignore
    return result.setValue(await func(...values));

}