import {Try} from "../../Try";
import {runSteps} from "../helpers";

export async function get(tryObject: Try<unknown>){
    const finalResult = await runSteps(tryObject.$internal.steps);
    tryObject.$internal.finalResult = finalResult;
    if(finalResult.isError())
        throw finalResult.getError();

    return finalResult.getValue();
}