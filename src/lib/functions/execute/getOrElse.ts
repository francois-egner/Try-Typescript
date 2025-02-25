import {Try} from "../../Try";
import {runSteps} from "../helpers";

export async function getOrElse(tryObject: Try<unknown>, fallbackValue: any){
    const finalResult = await runSteps(tryObject._steps);
    tryObject._finalResult = finalResult;

    if(finalResult.isError())
        return fallbackValue;

    return finalResult.getValue();
}