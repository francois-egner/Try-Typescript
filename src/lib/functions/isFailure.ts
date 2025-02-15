import {Result} from "../Result";

export async function isFailure(prev: Result): Promise<boolean>{
    return prev.isError()
}