# Try Class Implementation

## Overview

This repository contains an implementation of the `Try` class, inspired by the Vavr library in Java. The `Try` class is a functional programming construct designed to handle computations that may result in success or failure. It allows developers to encapsulate exceptions and manage error handling in a more functional and expressive manner, reducing boilerplate code and improving code readability.

## Features

- **Success and Failure Handling**: The implementation provides two subclasses, `Success` and `Failure`, to represent the result of computations. This makes it easy to handle both successful outcomes and exceptions gracefully.

- **Functional Methods**: Includes a variety of methods that allow for functional transformations and error recovery:
  - **Mapping**: Transform the result of a successful computation using `map` and `flatMap`.
  - **Error Recovery**: Recover from failures using `recover` and `recoverWith` methods.
  - **Conditional Execution**: Filter results with `filter` and execute side effects with `onSuccess` and `onFailure`.

- **Option and Either Conversion**: Convert the `Try` results into `Option` or `Either` for seamless integration with other functional programming constructs.

- **Custom Exception Handling**: Provides mechanisms to specify custom behavior for both success and failure cases, enabling tailored error handling strategies.

## Usage (Will be updated as soon as more functionality is implemented)

To use the `Try` class, instantiate it with a computation that may fail, and utilize the available methods to handle the result. Below is an example of how to use the `Try` class in TypeScript:

```typescript
class Try<T> {
    // Implementation of the Try class...
}

// Example of using the Try class
const result = new Try<number>(() => {
    return 10 / 2; // Successful computation
});

result
    .map(value => value * 2)
    .onSuccess(value => console.log(`Success: ${value}`)) // Output: Success: 10
    .onFailure(error => console.error(`Failed with error: ${error.message}`));

const failureResult = new Try<number>(() => {
    throw new Error("Division by zero");
}).recover(() => 0);

console.log(failureResult.get()); // Output: 0
```
