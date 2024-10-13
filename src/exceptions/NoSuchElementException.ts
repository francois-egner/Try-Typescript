export class NoSuchElementException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NoSuchElementException";
    }
}