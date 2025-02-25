/**
 * Represents an exception that is thrown when an element is not found.
 *
 * This custom error class extends the built-in `Error` class and provides a specific error type,
 * `NoSuchElementException`, to indicate that a required element could not be found.
 * It will be thrown if the `filter` functions predicate is true and no other Exception as a result is being provided.
 *
 * @extends {Error}
 */
export class NoSuchElementException extends Error {
    /**
     * Creates an instance of `NoSuchElementException`.
     *
     * @param {string} message The error message describing the specific failure.
     */
    constructor(message: string) {
        super(message);
        this.name = "NoSuchElementException";
    }
}