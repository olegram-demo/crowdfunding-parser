import * as winston from "winston"
import ILogger from "../interfaces/logger"
import {injectable} from "inversify";

@injectable()
 export default class WinstonLogger implements ILogger 
{
    logger: any

    constructor(options: any)
    {
        options.levels = {
            emergency: 0,
            alert: 1,
            critical: 2,
            error: 3,
            warning: 4,
            notice: 5,
            info: 6,
            debug: 7
        }
        this.logger = new winston.Logger(options)
    }

    emergency = (msg: string) => {
        this.logger.emergency(msg)
    }

    alert = (msg: string) => {
        this.logger.alert(msg)
    }

    critical = (msg: string) => {
        this.logger.critical(msg)
    }

    error = (msg: string) => {
        this.logger.error(msg)
    }

    warning = (msg: string) => {
        this.logger.warning(msg)
    }

    notice = (msg: string) => {
        this.notice(msg)
    }

    info = (msg: string): void => {
        this.logger.info(msg)
    }

    debug = (msg: string): void => {
        this.logger.debug(msg)
    }

    log = (level:string, msg: string): void => {
        this.logger.log(level, msg)
    }
}
