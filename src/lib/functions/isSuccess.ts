import {Result} from "../Result";

export async function isSuccess(prev: Result): Promise<boolean>{
    return !prev.isError()
}