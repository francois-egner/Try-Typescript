import { Try } from "../"
import {NoSuchElementException} from "../exceptions/NoSuchElementException";

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

    describe("Try.get", () => {
    test("get should return the value inside Success", async () => {
    const result = Try.success(2);
    expect(await result.get()).toBe(2);
    });

    test("get should throw the error inside Failure", async () => {
    const result = Try.failure(new Error("test error"));
    await expect(result.get()).rejects.toThrow("test error");
    });
    });

    describe("Try.getOrElse", () => {
    test("getOrElse should return the value inside Success", async () => {
    const result = Try.success(2);
    expect(await result.getOrElse(4)).toBe(2);
    });

    test("getOrElse should return the default value inside Failure", async () => {
    const result = Try.failure(new Error("test error"));
    expect(await result.getOrElse(4)).toBe(4);
    });
    });

    describe("Try.getOrElseGet", () => {
    test("getOrElseGet should return the value inside Success", async () => {
    const result = Try.success(2);
    expect(await result.getOrElseGet(() => 4)).toBe(2);
    });

    test("getOrElseGet should return the default value inside Failure", async () => {
    const result = Try.failure(new Error("test error"));
    expect(await result.getOrElseGet(() => 4)).toBe(4);
    });
    });

    describe("Try.getOrElseThrow", () => {
    test("getOrElseThrow should return the value inside Success", async () => {
    const result = Try.success(2);
    expect(await result.getOrElseThrow(() => new Error("test error"))).toBe(2);
    });

    test("getOrElseThrow should throw the custom error inside Failure", async () => {
    const result = Try.failure(new Error("test error"));
    await expect(result.getOrElseThrow(() => new Error("custom error"))).rejects.toThrow("custom error");
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

    describe("Try.andThen", () => {
    test("Try.andThen not modify the Try state and set and outside variable", async () => {
    let v;
    const result = Try.of(() => 5).andThen((value)=>{v =  value * 2});
    await expect(result.get()).resolves.toBe(5);
    expect(result.isSuccess()).toBe(true);
    expect(v).toBe(10);
    });

    test("Try.andThen should bring Try object into failure state with Custom Exception", async ()=> {
    const result = Try.of(() => 5).andThen((value)=>{throw new NoSuchElementException(`${value}`)})
    await expect(result.get()).rejects.toThrow("5");
    expect(result.isFailure()).toBe(true);
    })
    });

    describe("Try.andFinally", () => {
    test("Try.andFinally set outside value to 5 on success state", async () => {
    let v;
    const result = Try.of(() => 5).andFinally(()=>{v = 10});
    await expect(result.get()).resolves.toBe(5);
    expect(result.isSuccess()).toBe(true);
    expect(v).toBe(10);
    });

    test("Try.andFinally set outside value to 5 on failure state", async () => {
    let v;
    const result = Try.failure(new Error("5")).andFinally(()=>{v = 10});
    await expect(result.get()).rejects.toThrow("5");
    expect(result.isFailure()).toBe(true);
    expect(v).toBe(10);
    });

    });

    describe("Try.mapFailure", () => {
    class CustomException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CustomException";
    }
    }

    class MappedCustomException extends Error {
    cause: string;
    constructor(message: string, cause: string) {
        super(message);
        this.cause = cause;
        this.name = "MappedCustomException";
    }
    }

    test("Try.mapFailure should map an instance of CustomException to MappedCustomException", async () => {
    const result = Try.failure(new CustomException("This is a test!"))
        .mapFailure(async (_)=> new MappedCustomException("Mapped Custom Exception", "Custom Exception"));
    await expect(result.get()).rejects.toThrow(MappedCustomException);
    expect(result.isSuccess()).toBe(false);
    });
    });

    describe("Try.mapFailureWith", () => {
    class CustomException extends Error {
       constructor(message: string) {
           super(message);
           this.name = "CustomException";
       }
    }

    class MappedCustomException extends Error {
       cause: string;
       constructor(message: string, cause: string) {
           super(message);
           this.cause = cause;
           this.name = "MappedCustomException";
       }
    }

        test("Try.mapFailureWith should map an instance of CustomException to MappedCustomException", async () => {
           const result = Try.failure(new CustomException("This is a test!"))
               .mapFailureWith(CustomException, async (err) => {
                   return new MappedCustomException("Mapped Custom Exception", err.message);
               });
           await expect(result.get()).rejects.toThrow(MappedCustomException);
           expect(result.isSuccess()).toBe(false);
        });

        test("Try.mapFailureWith should not map an instance of CustomException to MappedCustomException", async () => {
            const result = Try.failure(new CustomException("This is a test!"))
                .mapFailureWith(Error, async (err) => {
                    return new MappedCustomException("Mapped Custom Exception", err.message);
                });
            await expect(result.get()).rejects.toThrow(CustomException);
            expect(result.isSuccess()).toBe(false);
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
    // @ts-ignore
    const result = Try.failure(new Error("test error")).map(v => v * 2);
    await expect(result.get()).rejects.toThrow("test error");
    expect(result.isFailure()).toBe(true);

    });

    });

    describe("Try.mapIf", () => {
    test("mapIf should transform the value inside Success if the predicate is true", async () => {
    const result = Try.success(2)
       .mapIf((v)=> v % 2 === 0, (v) => v * 2);
    await expect(result.get()).resolves.toBe(4);
    expect(result.isSuccess()).toBe(true);
    });

    test("mapIf shouldnt transform the value inside Success if the predicate is false", async () => {
    const result = Try.success(3)
       .mapIf((v)=> v % 2 === 0, (v) => v * 2);
    await expect(result.get()).resolves.toBe(3);
    expect(result.isSuccess()).toBe(true);
    });

    test("mapIf should not transform the value inside Failure", async () => {
    // @ts-ignore
    const result = Try.failure(new Error("test error")).mapIf((v)=> v % 2 === 0, v => v * 2);
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
            // @ts-ignore
            const result = Try.failure(new Error("test error")).flatMap(v => Try.success(v * 2));
            await expect(() => result.get()).rejects.toThrow("test error");
            expect(result.isFailure()).toBe(true);
        });
    });

    describe("Try.flatMapIf", () => {

        test("flatMapIf should transform the value inside Success if predicate is true", async () => {
            const result = Try.success(2).flatMapIf((v)=> v % 2 === 0, v => Try.success(v * 2));
            await expect(result.get()).resolves.toBe(4);
            expect(result.isSuccess()).toBe(true);
        });

        test("flatMapIf shouldnt transform the value inside Success if predicate is false", async () => {
            const result = Try.success(3).flatMapIf((v)=> v % 2 === 0, v => Try.success(v * 2));
            await expect(result.get()).resolves.toBe(3);
            expect(result.isSuccess()).toBe(true);
        });

        test("flatMap should not transform the value inside Failure", async () => {
            // @ts-ignore
            const result = Try.failure(new Error("test error")).flatMapIf((v)=> v % 2 === 0, v => Try.success(v * 2));
            await expect(() => result.get()).rejects.toThrow("test error");
            expect(result.isFailure()).toBe(true);
        });
    });

    describe("Try.filter", () => {

        test("filter should return Failure if predicate does not hold", async () => {
        const result = Try.success(2).filter(v => v <= 2);
        await expect(result.get()).rejects.toThrow("Predicate does not hold for 2");
        expect(result.isFailure()).toBe(true);
        });

        test("filter should throw custom exception if predicate does not hold", async () => {
        const result = Try.success(2).filter(v => v <= 2, v => Error("Custom Predicate does not hold for " + v));
        await expect(result.get()).rejects.toThrow("Custom Predicate does not hold for 2");
        expect(result.isFailure()).toBe(true);
        });

        test("filter should return Success if predicate holds", async () => {
        const result = Try.success(2).filter(v => v > 2);
        await expect(result.get()).resolves.toBe(2);
        expect(result.isSuccess()).toBe(true);

    });
    });

    describe("Try.filterNot", () => {

      test("filterNot should return Failure if predicate does not hold", async () => {
          const result = Try.success(2).filterNot(v => v > 2);
          await expect(result.get()).rejects.toThrow("Predicate does not hold for 2");
          expect(result.isFailure()).toBe(true);
      });

      test("filterNot should throw custom exception if predicate does not hold", async () => {
          const result = Try.success(2).filterNot(v => v > 2, v => Error("Custom Predicate does not hold for " + v));
          await expect(result.get()).rejects.toThrow("Custom Predicate does not hold for 2");
          expect(result.isFailure()).toBe(true);
      });

      test("filterNot should return Success if predicate holds", async () => {
          const result = Try.success(2).filterNot(v => v <= 2);
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
            const result = Try.success(2).map(value => value * 2).peek(_ => {throw new Error("Thrown in peek function")}).map(v => v * 2);
            await expect(result.get()).rejects.toThrow("Thrown in peek function");
            expect(result.isFailure()).toBe(true);
        });
    });

    describe("Try.recover", () => {
        test("recover should transform the value inside Failure", async () => {
            const result = Try.failure(new Error("test error")).recover(_ => "Recovered");
            await expect(result.get()).resolves.toBe("Recovered");
            expect(result.isSuccess()).toBe(true);
        });

        test("recover should not transform the value inside Success", async () => {
            const result = Try.success(2).recover(_ => "Recovered");
            await expect(result.get()).resolves.toBe(2);
            expect(result.isSuccess()).toBe(true);
        });
    });

    describe("Try.recoverWith", () => {
        test("recoverWith should transform the value inside Failure", async () => {
            const result = Try.failure(new Error("test error")).recoverWith(_ => Try.failure(new Error("Failure")).recover(_ =>"Recovered from inside"));
            await expect(result.get()).resolves.toBe("Recovered from inside");
            expect(result.isSuccess()).toBe(true);
        });

        test("recoverWith should not transform the value inside Success", async () => {
            const result = Try.success(2).recoverWith(_ => Try.success("Recovered"));
            await expect(result.get()).resolves.toBe(2);
            expect(result.isSuccess()).toBe(true);
        });
    });

    describe("Try.onSuccess", () => {
        test("onSuccess should be called on Success", async () => {
            let tempResult = 0;
            const result = Try.success(2).onSuccess(v => {tempResult = v});
            await expect(result.get()).resolves.toBe(2);
            expect(tempResult).toBe(2);
            expect(result.isSuccess()).toBe(true);
        });
    });

    describe("Try.onFailure", () => {
        test("onFailure should be called on Failure", async () => {
            let tempResult = "";
            const result = Try.failure(new NoSuchElementException("test error")).onFailure(e => {tempResult = e.message});
            await expect(result.get()).rejects.toThrow("test error");
            expect(tempResult).toBe("test error");
            expect(result.isFailure()).toBe(true);
        });
    });

    describe("Try.combine", () => {

      test("combine should run all Try instances and pass the results to the provided function", async () => {
          const r = Try.success(2);
          const r2 = Try.success(3);
          const r3 = Try.of(() => {
              if(0.6 > 0.5) return "3";
              throw new Error("Random error");
          });


          const f = (a: number, b: number, c: string) => a + b + c;

          const r4 = Try.combine(r, r2, r3, f);

          await expect(r4.get()).resolves.toBe("53");
          expect(r4.isSuccess()).toBe(true);

      });

      test("combine should run all Try instances and results in Failure for the first instance that is a Failure", async () => {
          const r = Try.success(2);
          const r2 = Try.success(3);
          const r3 = Try.of(() => {
              if(0.3 > 0.5) return "3";
              throw new Error("Random error");
          });


          const f = (a: number, b: number, c: string) => a + b + c;

          const r4 = Try.combine(r, r2, r3, f);

          await expect(r4.get()).rejects.toThrow("Random error");
          expect(r4.isFailure()).toBe(true);

      });
    });
});