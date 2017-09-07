const puppeteer = require('puppeteer');
import settings from "../config/config"
import ioc from "../config/ioc"
import ILogger from "../interfaces/logger"
import {randomArrayElement} from "random-array-element-ts"
const a = require("awaiting")

export default class ParserBase {
    
    protected name: string = ""
    
    protected browser: any
    protected logger: ILogger

    constructor (browser: any)
    {
        this.browser = browser
        this.logger = ioc.get("ParsersLogger")
    }

    protected log = (level:string, msg: string): void => {
        let prefix = this.name == "" ? "" : `[${this.name.toUpperCase()}] `
        this.logger.log(level, `${prefix}${msg}`)
    }

    protected randomDelay = async (min : number, max: number, log = true): Promise<void> => {
        let delay = Math.random() * (max - min) + min;
        if (log) this.log('info', `Ожидаем ${Math.round(delay/10)/100} сек.`)
        await a.delay(delay)
    }

    protected delay = async (ms : number): Promise<void> => {
        await a.delay(ms)
    }

}