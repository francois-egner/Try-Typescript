> [!CAUTION]
> This library is deprecated as it is now part of the new [func-typescript](https://github.com/francois-egner/func-typescript) library. New features will only be published in the new library.

# Try-Typescript

You can find this library on: 
- NPM: [Try-Typescript](https://www.npmjs.com/package/try-typescript)
- JSR: [Try-Typescript](https://jsr.io/@francois-egner/try-typescript)

## Overview

This repository contains an implementation of the `Try` class, inspired by the Vavr library in Java. The `Try` class is a functional programming construct designed to handle computations that may result in success or failure. It allows developers to encapsulate exceptions and manage error handling in a more functional and expressive manner, reducing boilerplate code and improving code readability.

## Features

- **Functional Methods**: Includes a variety of methods that allow for functional transformations and error recovery:
  - **Mapping**: Transform the result of a successful computation using `map` and `flatMap`.
  - **Error Recovery**: Recover from failures using `recover` and `recoverWith` methods.
  - **Conditional Execution**: Filter results with `filter` and execute side effects with `onSuccess` and `onFailure`.

- **Custom Exception Handling**: Provides mechanisms to specify custom behavior for both success and failure cases, enabling tailored error handling strategies.

# Available functions

## Initialization functions

### `static of<T>(func: () => T | Promise<T>): Try<T>`
Creates a Try instance from a function that may throw an error.
```typescript
const of = await Try.of(() => {
  if (Math.random() > 0.5) {
    return 10;
  } else {
    throw new Error('An error occurred');
  }
}).get(); // => 10 or throws 'An error occurred'
```
<br>


### `combine<T extends any[], R>(...args: [...{ [K in keyof T]: Try<T[K]> }, (...values: T) => R | Promise<R>]): Try<R>`
Sometimes you may want to combine multiple Try instances into one. This function allows you to do that. It takes multiple Try instances and a function that will be executed if all Try instances are successful. If one of the Try instances is a failure, the function will not be executed and the resulting Try instance will be a failure. <br>
```typescript
//All passed Try instances are successful
const r = Try.success(2);
const r2 = Try.success(3);
const r3 = Try.of(() => {
  if(0.6 > 0.5) return "3";
  throw new Error("Random error");
});

const f = (a: number, b: number, c: string) => a + b + c;

const r4 = await Try.combine(r, r2, r3, f).get(); //=> "53" ;

//One of the passed Try instances is a failure
const r = Try.success(2);
const r2 = Try.success(3);
const r3 = Try.of(() => {
  if(0.3 > 0.5) return "3";
  throw new Error("Random error");
}); //=> Is a Failure


const f = (a: number, b: number, c: string) => a + b + c;

const r4 = Try.combine(r, r2, r3, f);

await r4.get(); //=> Will throw 'Random error'
```
<br>

### `success<U>(value:U): Try<U>`
Creates a Try instance with a successful value.
```typescript
const success = await Try.success(10).get(); // => 10
```

<br>

### `failure<T>(error: Error): Try<T>`
Creates a Try instance with a failure value.
```typescript
const failure = await Try.failure(new Error('An error occurred')).get(); // => Will throw 'An error occurred'
```


## Execution functions
**This library will not run chained methods when they are called inside your code. You need to call a so called execution method to start executing the methods chain. This is necessary because of the nature of promises. Execution methods are async because they will run the async functions provided to chaining methods like `map`, `recover`, ...** <br>
If you just want to run the Try instance method chain without returning any value, you can use the `run` method. If you want to get the value of the Try instance, you can use the `get` method.

To give you an example, let's say you have a Try instance like below:
```typescript
const tryInstance = Try.success(10)
    .map(v => v + 1)
    .filter(v => v > 5)
    .recover(() => 0);
```
If you want to get the value of the computation of all methods, you can use the `get` method like below:
```typescript
const value = await tryInstance.get(); // => 11
```
Internally `get` will run all the methods in the chain: `map`, `filter`, `recover` and return the value of the Try instance. If you want to run the methods chain without getting the value, you can use the `run` method like below:
```typescript
await tryInstance.run(); // => Will run all the functions in the chain without returning the value.
```

<br><br>

### `get(): Promise<T>`
Gets the value of the Try instance. If the Try instance is a Failure, it will throw the error.<br> **Due to the nature of this library and potential asynchronous methods passed to transformation methods,
it is necessary to await the result of this function.**
```typescript
//Sucess
const value = await Try.success(10).get(); // => 10

//Failure
const failure = await Try.failure(new Error('An error occurred')).get(); // => Will throw 'An error occurred'
```

<br>

### `run(): Promise<Try<T>>`
Runs the Try instance and returns the Try instance itself. This is executing a Try instance if no returned value is expected. <br>
**Due to the nature of this library and potential asynchronous operations passed to transformation methods, it is necessary to await the result of this function.**
```typescript
//Success
const sucess = await Try.success(10).run(); // => Try instance with calculated value 10

//Failure
const failure = await Try.failure(new Error('An error occurred')).run(); // => Try instance with error 'An error occurred'

//Useful case
await Try.success(1)
        .filter(v => v > 2, v => { throw new Error("Custom Predicate does not hold for " + v)})
        .run(); //Will throw the custom error
```

<br>


### `getOrElse<U>(defaultValue: U): Promise<U | T>`
Returns the value of the Try instance if it is a Success, otherwise returns the default value.<br>
**Due to the nature of this library and potential asynchronous operations passed to transformation methods, it is necessary to await the result of this function.**
```typescript
//Success
const value = await Try.success(10).getOrElse(0); // => 10

//Failure
const failure = await Try.failure(new Error('An error occurred')).getOrElse(0); // => 0
```

<br>

### `getOrElseGet<U>(func: (ex: Error) => U | Promise<U>): Promise<T | U>`
Returns the value of the Try instance if it is a Success, otherwise returns the value returned by the function.
```typescript
//Success
const value = await Try.success(10).getOrElseGet(() => 0); // => 10

//Failure
const failure = await Try.failure(new Error('An error occurred')).getOrElseGet(() => 0); // => 0
```

<br>

### `getOrElseThrow(func: (error: Error) => Promise<Error> | Error): Promise<T>`
Returns the value of the Try instance if it is a Success, otherwise throws the error returned by the function.
```typescript
//Success
const value = await Try.success(10).getOrElseThrow(() => new Error('An error occurred')); // => 10

//Failure
const failure = await Try.failure(new Error('An error occurred')).getOrElseThrow(() => new Error('Another error occurred')); // => Will throw 'Another error occurred'
```

<br>

## Other functions

### `isSuccess(): boolean`
Returns true if the Try instance is a Success, otherwise returns false.
```typescript
//Success
const success = Try.success(10).isSuccess(); // => true

//Failure
const failure = Try.failure(new Error('An error occurred')).run().isSuccess(); // => false
```

<br>

### `isFailure(): boolean`
Returns true if the Try instance is a Failure, otherwise returns false.
```typescript
//Success
const success = Try.success(10).isFailure(); // => false

//Failure
const failure = Try.failure(new Error('An error occurred')).run().isFailure(); // => true
```

<br>

### `map<U>(func: (value: T) => U | Promise<U>): Try<U>`
Maps the value of the Try instance if it is a Success, otherwise returns the Failure instance.
```typescript
//Success
const value = await Try.success(10)
        .map(v => v + 1)
        .get(); // => 11

//Failure
const failure = await Try.failure(new Error('An error occurred'))
        .map(v => v + 1)
        .get(); // => Will throw 'An error occurred'
```
<br>

### `mapIf<U>(predicateFunc: (value: T) => boolean | Promise<boolean>, func: (value: T) => U | Promise<U>): Try<U>`
Maps the value of the Try instance if it is a Success and the predicate function evaluates to true. If not, the original state will be returned.
```typescript
//Success
const value = await Try.success(10)
        .mapIf((v)=> v % 2 === 0, v => v + 1)
        .get(); // => 11

const value = await Try.success(21)
        .mapIf((v)=> v % 2 === 0, v => v + 1)
        .get(); // => 21

//Failure
const failure = await Try.failure(new Error('An error occurred'))
        .mapIf((v)=> v % 2 === 0, v => v + 1)
        .get(); // => Will throw 'An error occurred'
```

<br>


### `flatMap<U>(func: (value: T) => Try<U> | Promise<Try<U>>): Try<U>`
Maps the value of the Try instance if it is a Success, otherwise returns the Failure instance.
```typescript
//Success
const value = await Try.success(10)
        .flatMap(v => Try.success(v + 1))
        .get(); // => 11

//Failure
const failure = await Try.failure(new Error('An error occurred'))
        .flatMap(v => Try.success(v + 1))
        .get(); // => Will throw 'An error occurred'
```
<br>

### `flatMapIf<U>(predicateFunc: (value: T) => boolean | Promise<boolean>, func: (value: T) => Try<U> | Promise<Try<U>>): Try<U>`
Maps the value of the Try instance if it is a Success and the predicate is true. If not, the original state will be returned.
```typescript
//Success
const value = await Try.success(10)
        .flatMapIf((v)=> v % 2 === 0, v => Try.success(v + 1))
        .get(); // => 11

const value = await Try.success(21)
        .flatMapIf((v)=> v % 2 === 0, v => Try.success(v + 1))
        .get(); // => 21

//Failure
const failure = await Try.failure(new Error('An error occurred'))
        .flatMapIf((v)=> v % 2 === 0, v => Try.success(v + 1))
        .get(); // => Will throw 'An error occurred'
```

<br>

### `mapFailure(func: (ex: Error) => Error | Promise<Error>): Try<T>`
Maps a failure of the Try instance if it is a Failure, otherwise returns the Success instance.
```typescript
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


  const result = Try.failure(new CustomException("This is a test!"))
          .mapFailure(async (_)=> new MappedCustomException("Mapped Custom Exception", "Custom Exception"))
});
```

<br>

### `mapFailureWith<E extends Error, U extends Error>(errorType: new (...args: any[]) => E, func: (ex: E) => U | Promise<U>): Try<T>`
Maps a failure of the Try instance if it is a specific error type using a function provided with the previous error if it is a Failure, otherwise returns the Success instance.
```typescript
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


const result = Try.failure(new CustomException("This is a test!"))
        .mapFailureWith(CustomException, async (err) => {
          return new MappedCustomException("Mapped Custom Exception", err.message);
        });
await expect(result.get()).rejects.toThrow(MappedCustomException);
expect(result.isSuccess()).toBe(false);

```

<br>

### `recover<U>(func: (error: Error) => U | Promise<U>): Try<T | U>`
Recovers the value of the Try instance if it is a Failure, otherwise returns the Success instance.
```typescript
//Success
const value = await Try.success(10)
        .recover(() => 0)
        .get(); // => 10
        
//Failure
const failure = await Try.failure(new Error('An error occurred'))
        .recover(() => 0)
        .get(); // => 0
```


<br>

### `recoverWith<U>(func: (error: Error) => Try<U> | Promise<Try<U>>): Try<U | T>`
Recovers the value of the Try instance if it is a Failure, otherwise returns the Success instance.
```typescript
//Success
const value = await Try.success(10)
        .recoverWith(() => Try.success(0))
        .get(); // => 10
        
//Failure
const failure = await Try.failure(new Error('An error occurred'))
        .recoverWith(() => Try.success(0))
        .get(); // => 0
```


<br>

### `andThen(func: (value: T) => Promise<void> | void): Try<T>`
Runs the function if the Try instance is a Success.
```typescript
//Success
const value = await Try.success(10)
        .andThen(v => console.log(v)) // => Will print 10
        .get(); // => 10

//Failure
const failure = await Try.failure(new Error('An error occurred'))
        .andThen(v => console.log(v)) // => Will print nothing
        .get(); // => Will throw 'An error occurred'
```
<br>

### `andFinally(func: () => Promise<void> | void): Try<T>`
Runs the function no matter the internal state (success or failure).
```typescript
//Success
let v_success;
const success = Try.of(() => 5).andFinally(()=>{v_success = 10}); // => will set the value of v to 10


//Failure
let v_failure;
const failure = Try.failure(new Error("5")).andFinally(()=>{v_failure = 10}); // => will set the value of v to 10, despite being a failure
```


<br>

### `filter(predicateFunc: (value: T) => boolean | Promise<boolean>, errorProvider?: (value: T) => Error): Try<T>`
Will throw default or custom Error if predicate is true.
```typescript
//Failure
const value = await Try.success(10)
        .filter(v => v > 5)
        .get(); // => Will throw 'Predicate does not hold for 10'
        
//Sucess
const failure = await Try.success(10)
        .filter(v => v > 15)
        .get(); // => 10

//Failure with custom error
const failureWithCustomError = await Try.success(10)
        .filter(v => v > 5, v => { throw new Error("Custom Predicate does not hold for " + v)})
        .get(); // => Will throw 'Custom Predicate does not hold for 10'
```


<br>

### `filterNot(predicateFunc: (value: T) => boolean | Promise<boolean>, errorProvider?: (value: T) => Error): Try<T>`
Will throw default or custom Error if predicate is false.
```typescript
//Failure
const value = await Try.success(10)
        .filterNot(v => v > 15)
        .get(); // => Will throw 'Predicate holds for 10'

//Success
const failure = await Try.success(10)
        .filterNot(v => v > 5)
        .get(); // => 10

//Failure with custom error
const failureWithCustomException = await Try.success(10)
        .filterNot(v => v > 15, v => { throw new Error("Custom Predicate holds for " + v)})
        .get(); // => Will throw 'Custom Predicate holds for 10'
```

<br>

### `onFailure(func: (value: Error) => Promise<void> | void): Try<T>`
Runs the function if the Try instance is a Failure.
```typescript
//Success
const value = await Try.success(10)
        .onFailure(ex => console.log(ex)) // => Will not print
        .get(); // => 10
        
//Failure
const failure = await Try.failure(new Error('An error occurred'))
        .onFailure(ex => console.log(ex)) // => Will print 'An error occurred'
        .run(); 
```


<br>

### `onSuccess(func: (value: T) => Promise<void> | void): Try<T>`
Runs the function if the Try instance is a Success.
```typescript
//Success
const value = await Try.success(10)
        .onSuccess(v => console.log(v)) // => Will print 10
        .get(); // => 10
        
        
//Failure
const failure = await Try.failure(new Error('An error occurred'))
        .onSuccess(v => console.log(v)) // => Will not print
        .get(); // => Will throw 'An error occurred'
```

<br>

### `getCause(): Error | undefined`
Returns the error of the Try instance if it is a Failure, otherwise returns undefined.
```typescript
//Success
const value = (await Try.success(10).run()).getCause(); // => undefined

//Failure
const failure = Try.failure(new Error('An error occurred')).getCause(); // => Error('An error occurred')
```


<br>

### `peek(func: (value: T) => Promise<void> | void): Try<T>`
Peeks the value of the Try instance if it is a Success, otherwise returns the Failure instance.
```typescript
//Success
const value = await Try.success(10)
        .peek(v => console.log(v)) // => Will print 10
        .get(); // => 10

//Failure
const failure = await Try.failure(new Error('An error occurred'))
        .peek(v => console.log(v)) // => Will not print
        .get(); // => Will throw 'An error occurred'
```
