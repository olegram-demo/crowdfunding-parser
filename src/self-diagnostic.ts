import "reflect-metadata"
import Crowdcube from "./parsers/platforms/crowdcube"
import Similarweb from "./parsers/others/similarweb"
import Project from "./entity/project"
import ioc from "./config/ioc"
import ILogger from "./interfaces/logger"

(async (): Promise<void> => {
    
    const service = process.argv.length > 2 ? process.argv[2] : null
    
    const browser = await ioc.get<Promise<any>>("Browser")
    const logger = ioc.get<ILogger>("ParsersLogger")

    if (service === null || service == "crowdcube") {
        logger.info("Выполняется проверка парсера площадки crowdcube.com")
        try {
            const platform = new Crowdcube(browser)
            const projects = await platform.getProjects(1)
            logger.info("Парсер crowdcube.com исправен.")
        } catch(err) {
            logger.error("Парсер crowdcube.com неисправен.")
        }
    }

    if (service === null || service == "similarweb") {
        logger.info("Выполняется проверка парсера similarweb")
        try {
            const project = new Project()
            project.companyName = "Onedox"
            project.web = "onedox.com"
            const parser = new Similarweb(browser)
            const data = await parser.getData(project)
            logger.info("Парсер similarweb исправен.")
        } catch(err) {
            logger.error("Парсер similarweb неисправен.")
        }
    }

    browser.close()
    process.exit(0)
})()