import {Result} from "../Result";


export async function failure(err: Error): Promise<Result> {
    return new Result().setError(err)
}