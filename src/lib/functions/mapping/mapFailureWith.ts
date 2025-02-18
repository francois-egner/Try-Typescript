import {Result} from "../../Result";
import {runInTry} from "../helpers";


export async function mapFailureWith<E extends Error, U extends Error>(prev: Result, errorType: new (...args: any[]) => E, func: (ex: E) => U | Promise<U>): Promise<Result>{
    if(!prev.isError())
        return prev;

    await runInTry(async () => {
        if (errorType.name === prev.getError()!.name)
            // @ts-ignore
            return prev.setError(await func(prev.getError()!));

    }, prev);

    return prev;
}