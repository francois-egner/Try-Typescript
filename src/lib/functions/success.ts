import {Result} from "../Result";


export async function success(value: any): Promise<Result> {
    return new Result().setValue(value);
}