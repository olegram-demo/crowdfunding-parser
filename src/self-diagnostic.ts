import "reflect-metadata"
import Crowdcube from "./parsers/platforms/crowdcube"
import Project from "./entity/project"
import {container} from "./config/config"
import * as phantom from "phantom"
import ILogger from "./interfaces/logger"

(async (): Promise<void> => {
    const service = process.argv.length > 2 ? process.argv[2] : null
    
    if (service === null || service == "crowdcube") {
        const browser = await container.get<Promise<phantom.PhantomJS>>("Browser")
        const logger = container.get<ILogger>("ParsersLogger")
        logger.info("Выполняется проверка парсера площадки crowdcube.com")
        try {
            const platform = new Crowdcube(browser)
            const projects = await platform.getProjects(1)
            logger.info("Парсер crowdcube.com работает.")
        } catch(err) {
            logger.error("Парсер crowdcube.com не работает.")
        } finally {
            browser.exit()
        }
    }

    process.exit(0)
})()