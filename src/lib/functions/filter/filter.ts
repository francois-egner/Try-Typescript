import {Result} from "../../Result";
import {NoSuchElementException} from "../../../exceptions/NoSuchElementException";


export async function filter<T>(prev: Result, predicate: (value: T) => boolean | Promise<boolean>, func?: (v: T) => Promise<Error> | Error): Promise<Result>{
    if(prev.isError() || !(await predicate(prev.getValue())))
        return prev

    try{
        if(func){
            return prev.setError(await func(prev.getValue()))
        }
        prev.setError(new NoSuchElementException(`Predicate does not hold for ${prev.getValue()}`))

    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}