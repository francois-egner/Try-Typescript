import { Try } from "../"

describe("Try", () => {
    test("Try.success should create a Success instance", () => {
        const result = Try.success("test");
        expect(result.isSuccess()).toBe(true);
        expect(result.get()).toBe("test");
    });

    test("Try.failure should create a Failure instance", () => {
        const error = new Error("test error");
        const result = Try.failure(error);
        expect(result.isFailure()).toBe(true);
        expect(() => result.get()).toThrow("test error");
    });

    test("Try.of should create a Success instance when no exception is thrown", () => {
        const result = Try.of(() => "test");
        expect(result.isSuccess()).toBe(true);
        expect(result.get()).toBe("test");
    });

    test("Try.of should create a Failure instance when an exception is thrown", () => {
        const result = Try.of(() => { throw new Error("test error"); });
        expect(result.isFailure()).toBe(true);
        expect(() => result.get()).toThrow("test error");
    });

    test("map should transform the value inside Success", () => {
        const result = Try.success(2).map(v => v * 2);
        expect(result.isSuccess()).toBe(true);
        expect(result.get()).toBe(4);
    });

    test("map should not transform the value inside Failure", () => {
        const error = new Error("test error");
        const result = Try.failure<number>(error).map(v => v * 2);
        expect(result.isFailure()).toBe(true);
        expect(() => result.get()).toThrow("test error");
    });

    test("flatMap should transform the value inside Success", () => {
        const result = Try.success(2).flatMap(v => Try.success(v * 2));
        expect(result.isSuccess()).toBe(true);
        expect(result.get()).toBe(4);
    });

    test("flatMap should not transform the value inside Failure", () => {
        const error = new Error("test error");
        const result = Try.failure<number>(error).flatMap(v => Try.success(v * 2));
        expect(result.isFailure()).toBe(true);
        expect(() => result.get()).toThrow("test error");
    });

    test("filter should return Failure if predicate does not hold", () => {
        const result = Try.success(2).filter(v => v > 2);
        expect(result.isFailure()).toBe(true);
        expect(() => result.get()).toThrow("Predicate does not hold for 2");
    });

    test("filter should return Success if predicate holds", () => {
        const result = Try.success(2).filter(v => v <= 2);
        expect(result.isSuccess()).toBe(true);
        expect(result.get()).toBe(2);
    });
});