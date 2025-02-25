import {
    of, success, failure, combine,
    get, getOrElse, getOrElseGet, getOrElseThrow, run,
    map, mapIf, flatMap, flatMapIf, mapFailure,
    andThen,  andFinally,
    onSuccess, onFailure,
    filter, filterNot, mapFailureWith,
    recover, recoverWith,
} from "./functions";
import {Result} from "./Result";

/**
 * Represents a step in the computation of a `Try` instance.
 *
 * A `Step` is a function that can either:
 * - Be an initial asynchronous function that returns a `Promise<Result>`, or
 * - Accept a previous `Result` and return a new `Promise<Result>`, allowing for chaining of computations.
 *
 * The `Step` type is used to track the operations performed during the `Try` computation and the transformations that happen to the result.
 *
 * @typedef {Step}
 */
export type Step = ((() => Promise<Result>) | ((prev: Result) => Promise<Result>));


/**
 * Represents a computation that may result in either a success or failure, capturing both outcomes.
 *
 * The `Try` class encapsulates a computation that can either be a successful result or an error (failure).
 * It provides methods to handle success and failure in a functional way, without throwing exceptions.
 *
 * @template T The type of the result if the computation is successful.
 */
export class Try<T> {


    /**
     * The internal state of the computation, which includes the list of steps performed and the final result.
     *
     * @type {object}
     * @internal
     * @hidden
     */
    public $internal: {
        /**
         * The final result of the computation, which may be a success or failure.
         * This is `undefined` if the computation has not yet been completed or finalized.
         *
         * @type {Result | undefined}
         */
        finalResult?: Result;

        /**
         * A list of steps representing the various operations performed during the computation.
         * Each step represents an individual transformation or check.
         *
         * @type {Step[]}
         */
        steps: Step[];
    } = {
        finalResult: undefined, // Initially undefined as computation may still be in progress
        steps: [] // Starts with an empty list of steps
    };

    /**
     * Private constructor that initializes the computation with a list of steps.
     * This constructor is used internally to create a `Try` instance.
     *
     * @param {Step[]} [steps=[]] The list of steps performed during the computation.
     */
    private constructor(steps: Step[] = []) {
        this.$internal.steps = steps;
    }


    /**
     * Creates a Try instance from a function that may throw an error or return a Promise.
     *
     * If the function executes successfully, the result is wrapped in a `Success`.
     * If the function throws an error or the Promise rejects, the result is wrapped in a `Failure`.
     *
     * @template T The type of the successful result.
     * @param {() => T | Promise<T>} func A function that returns a value or a Promise.
     * @returns {Try<T>} A Try instance representing the function execution result.
     */
    public static of<T>(func: () => T | Promise<T>): Try<T>{
        return new Try([()=> of(func)]);
    }


    /**
     * Combines multiple `Try` instances and a function into a single `Try` instance.
     *
     * The function receives the successful values of all `Try` instances as arguments.
     * If all `Try` instances are `Success`, the function is executed, and the result is wrapped in a `Success`.
     * If any `Try` instance is a `Failure`, the first encountered failure is returned.
     *
     * @template T The tuple type representing the values extracted from the `Try` instances.
     * @template R The return type of the provided function.
     * @param {...Array<Try<T[number]>>} args An array where the first elements are `Try` instances, followed by a function.
     * @returns {Try<R>} A `Try` instance containing either the function's result or the first failure encountered.
     */
    static combine<T extends any[], R>(...args: [...{ [K in keyof T]: Try<T[K]> }, (...values: T) => R | Promise<R>]): Try<R> {
        // @ts-ignore
        return new Try([()=> combine(...args)]);
    }


    /**
     * Creates a `Try` instance representing a successful computation.
     *
     * The provided value is wrapped in a `Success`, indicating a successful execution.
     *
     * @template U The type of the successful result.
     * @param {U} value The value to wrap in a `Success`.
     * @returns {Try<U>} A `Try` instance containing the given value as a success.
     */
    public static success<U>(value:U): Try<U> {
        return new Try([()=> success(value)]);
    }


    /**
     * Creates a `Try` instance representing a failed computation.
     *
     * The provided error is wrapped in a `Failure`, indicating an unsuccessful execution.
     *
     * @template T The expected type of the successful result (unused in failure cases).
     * @param {Error} err The error to wrap in a `Failure`.
     * @returns {Try<T>} A `Try` instance containing the given error as a failure.
     */
    public static failure<T>(err: Error): Try<T> {
        return new Try([()=> failure(err)]);
    }


    /**
     * Transforms the value inside the `Try` if it is a `Success`, using the provided function.
     *
     * If this `Try` is a `Success`, the function is applied to its value, and the result is wrapped in a new `Try`.
     * If this `Try` is a `Failure`, the failure is propagated without applying the function.
     *
     * @template U The type of the transformed result.
     * @param {(value: T) => U | Promise<U>} func A function to transform the value if this is a `Success`.
     * @returns {Try<U>} A new `Try` instance containing either the transformed value or the original failure.
     */
    public map<U>(func: (value: T) => U | Promise<U>): Try<U> {
        return new Try([...this.$internal.steps, (prev: Result)=> map(prev, func)])
    }


    /**
     * Conditionally transforms the value inside the `Try` if it is a `Success` and meets the predicate condition.
     *
     * If this `Try` is a `Success` and the `predicateFunc` returns `true`, the `func` is applied to transform the value.
     * If the predicate returns `false`, the original value is preserved.
     * If this `Try` is a `Failure`, the failure is propagated unchanged.
     *
     * @template U The type of the transformed result.
     * @param {(value: T) => boolean | Promise<boolean>} predicateFunc A function that determines whether the transformation should be applied.
     * @param {(value: T) => U | Promise<U>} func A function to transform the value if the predicate evaluates to `true`.
     * @returns {Try<U>} A new `Try` instance containing either the transformed value, the original value, or the failure.
     */
    public mapIf<U>(predicateFunc: (value: T) => boolean | Promise<boolean>, func: (value: T) => U | Promise<U>): Try<U>{
        return new Try([...this.$internal.steps, (prev: Result)=> mapIf(prev, predicateFunc, func)])
    }


    /**
     * Transforms a failure inside the `Try` if it matches the specified error type.
     *
     * If this `Try` is a `Failure` and the error is an instance of `errorType`, the provided function is applied to transform the error.
     * The transformed error is then wrapped in a new `Failure`.
     * If this `Try` is a `Success` or the error does not match `errorType`, the original value or failure is returned unchanged.
     *
     * @template E The specific error type to match and transform.
     * @template U The type of the transformed error.
     * @param {new (...args: any[]) => E} errorType The constructor of the error type to check against.
     * @param {(ex: E) => U | Promise<U>} func A function to transform the error if it matches `errorType`.
     * @returns {Try<T>} A new `Try` instance with either the transformed failure, the original failure, or the success.
     */
    public mapFailureWith<E extends Error, U extends Error>(errorType: new (...args: any[]) => E, func: (ex: E) => U | Promise<U>): Try<T>{
        return new Try([...this.$internal.steps, (prev: Result)=> mapFailureWith(prev, errorType, func)])
    }


    /**
     * Transforms the value inside the `Try` if it is a `Success`, returning a new `Try` instance.
     *
     * If this `Try` is a `Success`, the provided function is applied to its value,
     * returning either a `Try<U>` directly or a `Promise<Try<U>>`.
     * If this `Try` is a `Failure`, the failure is propagated unchanged.
     *
     * This differs from `map` by allowing the function to return a `Try<U>`, preventing nested `Try` instances.
     *
     * @template U The type of the transformed result.
     * @param {(value: T) => Try<U> | Promise<Try<U>>} func A function that transforms the value into another `Try` instance.
     * @returns {Try<U>} A new `Try` instance containing the transformed value or the original failure.
     */
    public flatMap<U>(func: (value: T) => Try<U> | Promise<Try<U>>): Try<U> {
        return new Try([...this.$internal.steps, (prev: Result)=> flatMap(prev, func)])
    }


    /**
     * Conditionally transforms the value inside the `Try` if it is a `Success` and meets the predicate condition,
     * returning a new `Try` instance.
     *
     * If this `Try` is a `Success` and the `predicateFunc` returns `true`, the `func` is applied to transform the value.
     * The function must return either a `Try<U>` directly or a `Promise<Try<U>>`.
     * If the predicate returns `false`, the original value is preserved.
     * If this `Try` is a `Failure`, the failure is propagated unchanged.
     *
     * This differs from `mapIf` by allowing the function to return a `Try<U>`, preventing nested `Try` instances.
     *
     * @template U The type of the transformed result.
     * @param {(value: T) => boolean | Promise<boolean>} predicateFunc A function that determines whether the transformation should be applied.
     * @param {(value: T) => Try<U> | Promise<Try<U>>} func A function that transforms the value into another `Try` instance if the predicate evaluates to `true`.
     * @returns {Try<U>} A new `Try` instance containing the transformed value, the original value, or the failure.
     */
    public flatMapIf<U>(predicateFunc: (value: T) => boolean | Promise<boolean>, func: (value: T) => Try<U> | Promise<Try<U>>): Try<U>{
        return new Try([...this.$internal.steps, (prev: Result)=> flatMapIf(prev, predicateFunc, func)])
    }


    /**
     * Returns the value inside the `Try` if it is a `Success`, or a fallback value if it is a `Failure`.
     *
     * This method ensures that no matter what, you will always get a value. If the `Try` is a `Success`, it returns the value inside.
     * If the `Try` is a `Failure`, it will return the provided `fallbackValue` instead.
     * The function is asynchronous and returns a `Promise` of the result.
     *
     * @template U The type of the fallback value.
     * @param {U} fallbackValue The value to return in case of failure.
     * @returns {Promise<U | T>} A `Promise` that resolves to either the value from the `Try` or the `fallbackValue`.
     */
    public async getOrElse<U>(fallbackValue: U): Promise<U | T>{
        return getOrElse(this, fallbackValue);
    }


    /**
     * Returns the value inside the `Try` if it is a `Success`, or computes a fallback value using the provided function if it is a `Failure`.
     *
     * If this `Try` is a `Success`, the value inside is returned.
     * If this `Try` is a `Failure`, the provided `func` is called with the error to compute a fallback value.
     * The function is asynchronous and returns a `Promise` of either the original value or the computed fallback value.
     *
     * @template U The type of the fallback value computed by the function.
     * @param {(ex: Error) => U | Promise<U>} func A function that computes the fallback value using the error.
     * @returns {Promise<T | U>} A `Promise` that resolves to either the value from the `Try` or the fallback computed by the function.
     */
    public async getOrElseGet<U>(func: (ex: Error) => U | Promise<U>): Promise<T | U> {
        return getOrElseGet(this, func)
    }


    /**
     * Returns the value inside the `Try` if it is a `Success`, or throws an error computed by the provided function if it is a `Failure`.
     *
     * If this `Try` is a `Success`, the value inside is returned.
     * If this `Try` is a `Failure`, the provided `func` is called with the error to compute a new error that will be thrown.
     * The function is asynchronous and returns a `Promise` that resolves to the value if successful, or throws an error.
     *
     * @param {(error: Error) => Promise<Error> | Error} func A function that computes a new error to throw using the original error.
     * @returns {Promise<T>} A `Promise` that resolves to the value from the `Try`, or throws the computed error.
     */
    public async getOrElseThrow(func: (error: Error) => Promise<Error> | Error): Promise<T>{
        return getOrElseThrow(this, func)
    }


    /**
     * Performs a side-effect with the value inside the `Try` if it is a `Success`.
     *
     * If this `Try` is a `Success`, the provided `func` is called with the value.
     * If this `Try` is a `Failure`, the function does nothing and the failure is propagated unchanged.
     * The function is useful for performing logging, analytics, or other side-effects without modifying the original `Try`.
     *
     * @param {(value: T) => Promise<void> | void} func A function to perform a side-effect with the value.
     * @returns {Try<T>} The original `Try` instance, allowing for further chaining.
     */
    public peek(func: (value: T) => Promise<void> | void): Try<T>{
        //According to the docs, peek is the same as `andThen`
        return new Try([...this.$internal.steps, (prev: Result)=> andThen(prev, func)])
    }


    /**
     * Performs a side-effect with the value inside the `Try` if it is a `Success`, and then returns the original `Try`.
     *
     * If this `Try` is a `Success`, the provided `func` is called with the value, and after the side effect, the original `Try` is returned.
     * If this `Try` is a `Failure`, the function does nothing and the failure is propagated unchanged.
     * This method is useful for chaining side-effects without modifying the original `Try`.
     *
     * @param {(value: T) => Promise<void> | void} func A function to perform a side-effect with the value.
     * @returns {Try<T>} The original `Try` instance, allowing for further chaining.
     */
    public andThen(func: (value: T) => Promise<void> | void): Try<T>{
        return new Try([...this.$internal.steps, (prev: Result)=> andThen(prev, func)])
    }


    /**
     * Filters the value inside the `Try` if it is a `Success`, returning a `Failure` if the predicate does match.
     *
     * If this `Try` is a `Success` and the `predicateFunc` returns `false`, the value is returned unchanged.
     * If the `predicateFunc` returns `true`, the `errorProvider` function (if provided) is called to generate an error,
     * and the result is a `Failure` with that error. If `errorProvider` is not provided, `NoSuchElementException` will be thrown.
     * If this `Try` is a `Failure`, the failure is propagated unchanged.
     *
     * @param {(value: T) => boolean | Promise<boolean>} predicateFunc A function that determines whether the value should be kept.
     * @param {(value: T) => Error} [errorProvider] A function that generates an error if the predicate returns `false`.
     * @returns {Try<T>} A new `Try` instance that either contains the value, or a `Failure` with the generated error.
     */
    public filter(predicateFunc: (value: T) => boolean | Promise<boolean>, errorProvider?: (value: T) => Error): Try<T>{
        return new Try([...this.$internal.steps, (prev: Result)=> filter(prev, predicateFunc, errorProvider)])
    }


    /**
     * Filters the value inside the `Try` if it is a `Success`, returning a `Failure` if the predicate does not match.
     *
     * If this `Try` is a `Success` and the `predicateFunc` returns `true`, the value is returned unchanged.
     * If the `predicateFunc` returns `false`, the `errorProvider` function (if provided) is called to generate an error,
     * and the result is a `Failure` with that error. If `errorProvider` is not provided, `NoSuchElementException` will be thrown.
     * If this `Try` is a `Failure`, the failure is propagated unchanged.
     *
     * @param {(value: T) => boolean | Promise<boolean>} predicateFunc A function that determines whether the value should be excluded.
     * @param {(value: T) => Error} [errorProvider] A function that generates an error if the predicate returns `true`.
     * @returns {Try<T>} A new `Try` instance that either contains the value, or a `Failure` with the generated error.
     */
    public filterNot(predicateFunc: (value: T) => boolean | Promise<boolean>, errorProvider?: (value: T) => Error): Try<T>{
        return new Try([...this.$internal.steps, (prev: Result)=> filterNot(prev, predicateFunc, errorProvider)])
    }


    /**
     * Recovers from a failure by applying a function to the error, returning a new value.
     *
     * If this `Try` is a `Failure`, the provided `func` is called with the error to generate a recovery value.
     * If this `Try` is a `Success`, the value is returned unchanged.
     * The function is asynchronous and returns a `Promise` of either the original value or the recovered value.
     *
     * @template U The type of the recovered value.
     * @param {(error: Error) => U | Promise<U>} func A function to recover from the failure and generate a new value.
     * @returns {Try<T | U>} A new `Try` instance containing the original value if the `Try` was a success, or the recovered value if it was a failure.
     */
    public recover<U>(func: (error: Error) => U | Promise<U>): Try<T | U>{
        return new Try([...this.$internal.steps, (prev: Result)=> recover(prev, func)])
    }


    /**
     * Recovers from a failure by applying a function to the error, returning a new `Try` instance.
     *
     * If this `Try` is a `Failure`, the provided `func` is called with the error to generate a new `Try` value.
     * If this `Try` is a `Success`, the value is returned unchanged.
     * The function is asynchronous and can return either a `Try<U>` directly or a `Promise<Try<U>>`.
     *
     * @template U The type of the recovered value.
     * @param {(error: Error) => Try<U> | Promise<Try<U>>} func A function to recover from the failure and generate a new `Try` instance.
     * @returns {Try<U | T>} A new `Try` instance containing the original value if the `Try` was a success, or the recovered value if it was a failure.
     */
    public recoverWith<U>(func: (error: Error) => Try<U> | Promise<Try<U>>): Try<U | T>{
        return new Try([...this.$internal.steps, (prev: Result)=> recoverWith(prev, func)])
    }


    /**
     * Retrieves the value inside the `Try` if it is a `Success`, or throws the error if it is a `Failure`.
     *
     * If this `Try` is a `Success`, the value inside is returned.
     * If this `Try` is a `Failure`, the error is thrown, allowing you to handle the failure.
     * The function is asynchronous and returns a `Promise` that resolves to the value if successful or rejects with the error if failed.
     *
     * @returns {Promise<T>} A `Promise` that resolves to the value from the `Try` if it is a success, or throws the error if it is a failure.
     */
    public async get(): Promise<T> {
        return get(this);
    }


    /**
     * Executes the computation and returns the `Try` result wrapped in a `Promise`.
     *
     * This method runs the `Try`-based computation and asynchronously returns the outcome as a `Try<T>`.
     * If the computation is successful, it will return a `Success` with the value.
     * If there is an error or failure, it will return a `Failure` with the error.
     * This is useful for wrapping asynchronous computations within a `Try`.
     *
     * @returns {Promise<Try<T>>} A `Promise` that resolves to a `Try` instance, either containing the result of a successful computation or an error.
     */
    public async run(): Promise<Try<T>>{
        await run(this);
        return this;
    }


    /**
     * Checks if the `Try` instance is a `Success`.
     *
     * This method returns `true` if the `Try` is a `Success` (i.e., it contains a value).
     * It returns `false` if the `Try` is a `Failure` (i.e., it contains an error).
     *
     * @returns {boolean} `true` if the `Try` is a `Success`, otherwise `false`.
     */
    public isSuccess(): boolean {
        return !this.$internal.finalResult!.isError();
    }


    /**
     * Checks if the `Try` instance is a `Failure`.
     *
     * This method returns `true` if the `Try` is a `Failure` (i.e., it contains an error).
     * It returns `false` if the `Try` is a `Success` (i.e., it contains a value).
     *
     * @returns {boolean} `true` if the `Try` is a `Failure`, otherwise `false`.
     */
    public isFailure(): boolean {
        return this.$internal.finalResult!.isError();
    }


    /**
     * Performs a side-effect with no impact on the `Try` result, after the computation is complete.
     *
     * This method allows you to perform some cleanup or side-effects, such as logging or resource releasing,
     * regardless of whether the `Try` is a `Success` or a `Failure`.
     * The original `Try` is returned unchanged, allowing for further chaining.
     *
     * @param {() => Promise<void> | void} func A function to perform the side-effect. It is called after the `Try` computation completes.
     * @returns {Try<T>} The original `Try` instance, allowing for further chaining.
     */
    public andFinally(func: () => Promise<void> | void): Try<T> {
        return new Try([...this.$internal.steps, (prev: Result)=> andFinally(prev, func)])
    }


    /**
     * Transforms the error inside a `Failure` using the provided function.
     *
     * If this `Try` is a `Failure`, the provided `func` is called with the error to transform it into a new error.
     * If this `Try` is a `Success`, the value is returned unchanged.
     * The function is useful for modifying or enriching errors when the `Try` is in a failure state.
     *
     * @param {(ex: Error) => Error | Promise<Error>} func A function to transform the error.
     * @returns {Try<T>} A new `Try` instance that contains either the original value (if successful) or the transformed error (if failure).
     */
    public mapFailure(func: (ex: Error) => Error | Promise<Error>): Try<T>{
        return new Try([...this.$internal.steps, (prev: Result)=> mapFailure(prev, func)])
    }


    /**
     * Retrieves the error inside a `Failure`, or returns `undefined` if it is a `Success`.
     *
     * If this `Try` is a `Failure`, the error inside is returned.
     * If this `Try` is a `Success`, `undefined` is returned, since there is no error.
     * This method is useful for inspecting the error when the `Try` is in a failure state.
     *
     * @returns {Error | undefined} The error inside the `Failure` if present, otherwise `undefined`.
     */
    public getCause(): Error | undefined {
        return this.$internal.finalResult!.getError()
    }


    /**
     * Executes a side-effect with the value inside the `Try` if it is a `Success`.
     *
     * If this `Try` is a `Success`, the provided `func` is called with the value to perform a side-effect.
     * If this `Try` is a `Failure`, the function does nothing and the failure is propagated unchanged.
     * This method is useful for actions like logging or other operations that should only run when the `Try` is a success.
     *
     * @param {(value: T) => Promise<void> | void} func A function to execute the side-effect with the value.
     * @returns {Try<T>} The original `Try` instance, allowing for further chaining.
     */
    public onSuccess(func: (value: T) => Promise<void> | void): Try<T>{
        return new Try([...this.$internal.steps, (prev: Result)=> onSuccess(prev, func)])
    }


    /**
     * Executes a side-effect with the error inside the `Try` if it is a `Failure`.
     *
     * If this `Try` is a `Failure`, the provided `func` is called with the error to perform a side-effect.
     * If this `Try` is a `Success`, the function does nothing and the success value is propagated unchanged.
     * This method is useful for actions like logging or handling errors when the `Try` fails.
     *
     * @param {(value: Error) => Promise<void> | void} func A function to execute the side-effect with the error.
     * @returns {Try<T>} The original `Try` instance, allowing for further chaining.
     */
    public onFailure(func: (value: Error) => Promise<void> | void): Try<T>{
        return new Try([...this.$internal.steps, (prev: Result)=> onFailure(prev, func)])
    }

}