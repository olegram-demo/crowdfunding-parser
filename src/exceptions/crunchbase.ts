export default class CrunchbaseError extends Error {
    constructor (msg: string) {
        super(msg)
        Object.setPrototypeOf(this, CrunchbaseError.prototype)
    }
}