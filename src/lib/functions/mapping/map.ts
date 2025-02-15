import {Result} from "../../Result";


export async function map(prev: Result, func: (v: any)=> any): Promise<Result>{
    if(prev.isError())
        return prev

    try{
        prev.setValue(await func(prev.getValue()))
    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}