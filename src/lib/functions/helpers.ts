import {Result} from "../Result";
import {Step} from "../Try";



export async function runSteps(steps: Step[]): Promise<Result> {
    let result: Result = new Result();
    for (const step of steps) {
        result = await step(result);
    }
    return result;
}