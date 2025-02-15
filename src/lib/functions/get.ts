import {Step, Try} from "../Try";
import {runSteps} from "./helpers";

export async function get(tryObject: Try<unknown>){
    const finalResult = await runSteps(tryObject.steps);
    tryObject._finalResult = finalResult;
    if(finalResult.isError())
        throw finalResult.getError();
    return finalResult.getValue();
}