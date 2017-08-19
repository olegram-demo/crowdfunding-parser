import {Container} from "inversify"
import * as qwe from "inversify"
import ILogger from "../interfaces/logger"
import WinstonLogger from "../loggers/winston"
import * as winston from "winston"
import * as phantom from "phantom"
import {Connection, createConnection} from "typeorm"
import Project from "../entity/project"
import * as moment from "moment"

const container = new Container()
const browserLogger = new WinstonLogger({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({filename: 'logs/browser.log'})
    ]
})

container.bind<ILogger>("BrowserLogger").toConstantValue(browserLogger)

container.bind<Promise<phantom.PhantomJS>>("Browser").toConstantValue(phantom.create([], {
    'logger': {
        warn: browserLogger.warning,
        debug: browserLogger.debug,
        error: browserLogger.error,
        info: browserLogger.info
    }
}))

container.bind<ILogger>("ParsersLogger").toConstantValue(new (WinstonLogger)({
    transports: [
        new (winston.transports.Console)({
            handleExceptions: true,
            humanReadableUnhandledException: true,
            level: 'info',
            colorize: true,
            timestamp: () => {
                return '[' + moment().format('hh:mm:ss.SSS') + ']'
            }
        }),
        new (winston.transports.File)({
            name: "parsers",
            filename: "logs/parsers.log",
            handleExceptions: true,
            humanReadableUnhandledException: true,
            level: 'debug'
        }),
        new (winston.transports.File)({
            name: "parsersErrors",
            filename: "logs/parsers-errors.log",
            level: "error",
            handleExceptions: true,
            humanReadableUnhandledException: true
        })
    ],
    exitOnError: false
}))

container.bind<Promise<Connection>>("DB").toConstantValue(createConnection({
    "type": "sqlite",
    "database": "db.sqlite3",
    "autoSchemaSync": true,
    "entities": [Project],
}))

export default container