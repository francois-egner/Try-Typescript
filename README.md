# Try-Typescript

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

### `of<T>(fn: () => T): Try<T>`
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

### `success<T>(value: T): Try<T>`
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

### `getOrElseGet<U>(fn: (ex: Error) => U): Promise<T | U>`
Returns the value of the Try instance if it is a Success, otherwise returns the value returned by the function.
```typescript
//Success
const value = await Try.success(10).getOrElseGet(() => 0); // => 10

//Failure
const failure = await Try.failure(new Error('An error occurred')).getOrElseGet(() => 0); // => 0
```

<br>

### `getOrElseThrow<U>(fn: (error: Error) => U): Promise<T | U>`
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

### `map<U>(fn: (value: T) => U): Try<U>`
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

### `flatMap<U>(fn: (value: T) => Try<U>) : Try<U>`
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

### `recover<U>(fn: (error: Error) => U): Try<T | U>`
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

### `recoverWith<U>(fn: (error: Error) => Try<U>): Try<U | T>`
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

### `andThen(fn: (value: T) => any): Try<T>`
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

### `filter(predicateFunc: (value: T) => boolean, throwbackFunction?: (value: T) => void): Try<T>`
Filters the value of the Try instance if it is a Success, otherwise returns the Failure instance.
```typescript
//Success
const value = await Try.success(10)
        .filter(v => v > 5)
        .get(); // => 10
        
//Failure
const failure = await Try.success(10)
        .filter(v => v > 15)
        .get(); // => Will throw 'Predicate does not hold for 10'

//Failure with custom error
const failureWithCustomError = await Try.success(10)
        .filter(v => v > 15, v => { throw new Error("Custom Predicate does not hold for " + v)})
        .get(); // => Will throw 'Custom Predicate does not hold for 10'
```


<br>

### `filterNot(predicateFunc: (value: T) => boolean, throwbackFunction?: (value: T) => void): Try<T>`
Filters the value of the Try instance if it is a Success, otherwise returns the Failure instance.
```typescript
//Success
const value = await Try.success(10)
        .filterNot(v => v > 15)
        .get(); // => 10
        
//Failure
const failure = await Try.success(10)
        .filterNot(v => v > 5)
        .get(); // => Will throw 'Predicate holds for 10'

//Failure with custom error
const failureWithCustomException = await Try.success(10)
        .filterNot(v => v > 5, v => { throw new Error("Custom Predicate holds for " + v)})
        .get(); // => Will throw 'Custom Predicate holds for 10'
```

<br>

### `onFailure(fn: (ex: Error) => void): Try<T>`
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

### `onSuccess(fn: (value: T) => void): Try<T>`
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

### `peek(fn: (value: T) => void): Try<T>`
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
