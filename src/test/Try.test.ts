import { Try } from "../"

describe("Try", () => {

    describe("Try.success", () => {
        test("Try.success should create a Success instance", async () => {
            const result = Try.success("test");
            expect(await result.get()).toBe("test");
            expect(result.isSuccess()).toBe(true);
        });
    });

    describe("Try.failure", () => {
        test("Try.failure should create a Failure instance", async () => {
            const result = Try.failure(new Error("test error"));
            await expect(result.get()).rejects.toThrow("test error");
            expect(result.isFailure()).toBe(true);
        });
    });

    describe("Try.of", () => {
        test("Try.of should create a Success instance when no exception is thrown", async () => {
            const result = Try.of(() => "test");
            await expect(result.get()).resolves.toBe("test");
            expect(result.isSuccess()).toBe(true);
        });

        test("Try.of should create a Failure instance when an exception is thrown", async () => {
            const result = Try.of(() => { throw new Error("test error"); });
            await expect(result.get()).rejects.toThrow("test error");
            expect(result.isFailure()).toBe(true);
        });
    });

   describe("Try.map", () => {
        test("map should transform the value inside Success", async () => {
            const result = Try.success(2)
                .map(v => v * 2);
            await expect(result.get()).resolves.toBe(4);
            expect(result.isSuccess()).toBe(true);
        });

        test("map should not transform the value inside Failure", async () => {
            const result = Try.failure(new Error("test error")).map(v => v * 2);
            await expect(result.get()).rejects.toThrow("test error");
            expect(result.isFailure()).toBe(true);

        });
    });

    describe("Try.flatMap", () => {
        test("flatMap should transform the value inside Success", async () => {
            const result = Try.success(2).flatMap(v => Try.success(v * 2));
            await expect(result.get()).resolves.toBe(4);
            expect(result.isSuccess()).toBe(true);
        });

        test("flatMap should not transform the value inside Failure", async () => {
            const result = Try.failure(new Error("test error")).flatMap(v => Try.success(v * 2));
            await expect(() => result.get()).rejects.toThrow("test error");
            expect(result.isFailure()).toBe(true);
        });
    });

    /*
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
    });*/
});