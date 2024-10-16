import { Try } from "../"

describe("Try", () => {

    describe("Try.success", () => {
        test("Try.success should create a Success instance", () => {
            const result = Try.success("test");
            expect(result.isSuccess()).toBe(true);
            expect(result.get()).toBe("test");
        });
    });

    describe("Try.failure", () => {
        test("Try.failure should create a Failure instance", () => {
            const error = new Error("test error");
            const result = Try.failure(error);
            expect(result.isFailure()).toBe(true);
            expect(() => result.get()).toThrow("test error");
        });
    });

    describe("Try.of", () => {
        test("Try.of should create a Success instance when no exception is thrown", async () => {
            const result = await Try.of(() => "test");
            expect(result.isSuccess()).toBe(true);
            expect(result.get()).toBe("test");
        });

        test("Try.of should create a Failure instance when an exception is thrown", async () => {
            const result = await Try.of(() => { throw new Error("test error"); });
            expect(result.isFailure()).toBe(true);
            expect(() => result.get()).toThrow("test error");
        });
    });

    describe("Try.map", () => {
        test("map should transform the value inside Success", async () => {
            const result = await Try.success(2).map(v => v * 2);
            expect(result.isSuccess()).toBe(true);
            expect(result.get()).toBe(4);
        });

        test("map should not transform the value inside Failure", async () => {
            const error = new Error("test error");
            const result = await Try.failure<number>(error).map(v => v * 2);
            expect(result.isFailure()).toBe(true);
            expect(() => result.get()).toThrow("test error");
        });
    });

    describe("Try.flatMap", () => {
        test("flatMap should transform the value inside Success", async () => {
            const result = await Try.success(2).flatMap(v => Try.success(v * 2));
            expect(result.isSuccess()).toBe(true);
            expect(result.get()).toBe(4);
        });

        test("flatMap should not transform the value inside Failure", async () => {
            const error = new Error("test error");
            const result = await Try.failure<number>(error).flatMap(v => Try.success(v * 2));
            expect(result.isFailure()).toBe(true);
            expect(() => result.get()).toThrow("test error");
        });
    });

    describe("Try.filter", () => {
        test("filter should return Failure if predicate does not hold", async () => {
            const result = await Try.success(2).filter(v => v > 2);
            expect(result.isFailure()).toBe(true);
            expect(() => result.get()).toThrow("Predicate does not hold for 2");
        });

        test("filter should return Success if predicate holds", async () => {
            const result = await Try.success(2).filter(v => v <= 2);
            expect(result.isSuccess()).toBe(true);
            expect(result.get()).toBe(2);
        });
    });
});