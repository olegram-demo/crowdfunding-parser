import * as phantom from "phantom"
import {container} from "../config/config"
import ILogger from "../interfaces/logger"
const a = require("awaiting")

export default class ParserBase {
    
    protected name: string = ""
    
    protected browser: phantom.PhantomJS
    protected page: phantom.WebPage
    protected logger: ILogger

    constructor (browser: phantom.PhantomJS)
    {
        this.browser = browser
        this.logger = container.get("ParsersLogger")
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

    protected init = async () : Promise<void> => {
        this.page = await this.browser.createPage()
        await this.page.property('viewportSize', {width: 1024, height: 768});
    }

}