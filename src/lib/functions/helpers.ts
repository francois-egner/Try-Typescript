import {Result} from "../Result";
import {Step} from "../Try";



export async function runSteps(steps: Step[]): Promise<Result> {
    let result: Result = new Result();
    for (const step of steps) {
        result = await step(result);
    }
    return result;
}

export async function runInTry(func: ()=> Promise<Result | void>, prev: Result, ignoreException = false){
    try{
        await func();
        return true;
    }catch(err: unknown){
        if(!ignoreException)
            prev.setError(err);
        return false;
    }
}