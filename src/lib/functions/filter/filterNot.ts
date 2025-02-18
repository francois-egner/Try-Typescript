import {Result} from "../../Result";
import {NoSuchElementException} from "../../../exceptions/NoSuchElementException";
import {runInTry} from "../helpers";


export async function filterNot<T>(prev: Result, predicate: (value: T) => boolean | Promise<boolean>, func?: (v: T) => Promise<Error> | Error): Promise<Result>{

    await runInTry(async ()=>{
        if(prev.isError() || await predicate(prev.getValue()))
            return prev;

        if(func){
            return prev.setError(await func(prev.getValue()));
        }
        prev.setError(new NoSuchElementException(`Predicate does not hold for ${prev.getValue()}`));
    }, prev);

    return prev;

}