export default class CrowdcubeError extends Error {
    constructor (msg: string) {
        super(msg)
        Object.setPrototypeOf(this, CrowdcubeError.prototype)
    }
}