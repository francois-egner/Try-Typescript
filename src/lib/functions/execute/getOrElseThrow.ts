import {Step, Try} from "../../Try";
import {Result} from "../../Result";
import {runSteps} from "../helpers";

export async function getOrElseThrow(tryObject: Try<unknown>, func: (err: Error) => Promise<Error> | Error){
    const finalResult = await runSteps(tryObject._steps);
    tryObject._finalResult = finalResult;

    if(finalResult.isError())
        throw await func(finalResult.getError()!)
    return finalResult.getValue();
}