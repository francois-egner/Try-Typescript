import {Result} from "../../Result";


export async function mapIf(prev: Result, predicate: (v: any) => Promise<boolean> | boolean,func: (v: any)=> any): Promise<Result>{
    if(prev.isError() || !(await predicate(prev.getValue())))
        return prev

    try{
        prev.setValue(await func(prev.getValue()))
    }catch(err: unknown){
        prev.setError(err as Error);
    }

    return prev;

}