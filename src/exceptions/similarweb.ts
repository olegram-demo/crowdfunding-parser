export default class SimilarwebError extends Error {
    constructor (msg: string) {
        super(msg)
        Object.setPrototypeOf(this, SimilarwebError.prototype)
    }
}