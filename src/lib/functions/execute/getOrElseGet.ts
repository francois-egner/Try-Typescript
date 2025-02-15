import {Try} from "../../Try";
import {runSteps} from "../helpers";

export async function getOrElseGet(tryObject: Try<unknown>, func: (err: Error) => any){
    const finalResult = await runSteps(tryObject.steps);
    tryObject._finalResult = finalResult;

    if(finalResult.isError())
        return await func(finalResult.getError()!)
    return finalResult.getValue();
}