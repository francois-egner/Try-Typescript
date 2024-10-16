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

    describe("Try.filter", () => {
        test("filter should return Failure if predicate does not hold", async () => {
            const result = Try.success(2).filter(v => v > 2);
            await expect(result.get()).rejects.toThrow("Predicate does not hold for 2");
            expect(result.isFailure()).toBe(true);
        });

        test("filter should throw custom exception if predicate does not hold", async () => {
            const result = Try.success(2).filter(v => v > 2, v => { throw new Error("Custom Predicate does not hold for " + v) });
            await expect(result.get()).rejects.toThrow("Custom Predicate does not hold for 2");
            expect(result.isFailure()).toBe(true);
        });

        test("filter should return Success if predicate holds", async () => {
            const result = Try.success(2).filter(v => v <= 2);
            await expect(result.get()).resolves.toBe(2);
            expect(result.isSuccess()).toBe(true);

        });
    });

    describe("Try.filterNot", () => {
        test("filterNot should return Failure if predicate does not hold", async () => {
            const result = Try.success(2).filterNot(v => v <= 2);
            await expect(result.get()).rejects.toThrow("Predicate does not hold for 2");
            expect(result.isFailure()).toBe(true);
        });

        test("filterNot should throw custom exception if predicate does not hold", async () => {
            const result = Try.success(2).filterNot(v => v <= 2, v => { throw new Error("Custom Predicate does not hold for " + v) });
            await expect(result.get()).rejects.toThrow("Custom Predicate does not hold for 2");
            expect(result.isFailure()).toBe(true);
        });

        test("filterNot should return Success if predicate holds", async () => {
            const result = Try.success(2).filterNot(v => v > 2);
            await expect(result.get()).resolves.toBe(2);
            expect(result.isSuccess()).toBe(true);

        });
    });

    describe("Try.peek", () => {
        test("should print out the current value in the chain", async () => {
            let tempResult = 0;
            const result = Try.success(2).map(value => value * 2).peek(v => {tempResult = v}).map(v => v * 2);
            await expect(result.get()).resolves.toBe(8);
            expect(tempResult).toBe(4);
            expect(result.isSuccess()).toBe(true);
        });

        test("should convert to failure if peek function throws", async () => {
            const result = Try.success(2).map(value => value * 2).peek(v => {throw new Error("Thrown in peek function")}).map(v => v * 2);
            await expect(result.get()).rejects.toThrow("Thrown in peek function");
            expect(result.isFailure()).toBe(true);
        });
    });

    describe("Try.recover", () => {
        test("recover should transform the value inside Failure", async () => {
            const result = Try.failure(new Error("test error")).recover(e => "Recovered");
            await expect(result.get()).resolves.toBe("Recovered");
            expect(result.isSuccess()).toBe(true);
        });

        test("recover should not transform the value inside Success", async () => {
            const result = Try.success(2).recover(e => "Recovered");
            await expect(result.get()).resolves.toBe(2);
            expect(result.isSuccess()).toBe(true);
        });
    });

    describe("Try.recoverWith", () => {
        test("recoverWith should transform the value inside Failure", async () => {
            const result = Try.failure(new Error("test error")).recoverWith(e => Try.failure(new Error("Failure")).recover(e =>"Recovered from inside"));
            await expect(result.get()).resolves.toBe("Recovered from inside");
            expect(result.isSuccess()).toBe(true);
        });

        test("recoverWith should not transform the value inside Success", async () => {
            const result = Try.success(2).recoverWith(e => Try.success("Recovered"));
            await expect(result.get()).resolves.toBe(2);
            expect(result.isSuccess()).toBe(true);
        });
    });
});