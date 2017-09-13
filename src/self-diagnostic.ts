import "reflect-metadata"
import Crowdcube from "./parsers/platforms/crowdcube"
import Similarweb from "./parsers/others/similarweb"
import CrunchbaseParser from "./parsers/others/crunchbase"
import Project from "./entity/project"
import ioc from "./config/ioc"
import ILogger from "./interfaces/logger"

(async (): Promise<void> => {
    
    const service = process.argv.length > 2 ? process.argv[2] : null
    
    const browser = await ioc.get<Promise<any>>("Browser")
    const logger = ioc.get<ILogger>("ParsersLogger")

    if (service === null || service == "crowdcube") {
        await crowdcubeDiagnostic(browser, logger)
    }

    if (service === null || service == "similarweb") {
        await similarwebDiagnostic(browser, logger)
    }

    if (service === null || service == "crunchbase") {
        await crunchbaseDiagnostic(browser, logger)
    }

    browser.close()
    process.exit(0)
})()

async function crowdcubeDiagnostic(browser: any, logger: ILogger): Promise<void> {
    logger.info("Выполняется проверка парсера площадки crowdcube.com")
    try {
        const platform = new Crowdcube(browser)
        const projects = await platform.getProjects(1)
        logger.info("Парсер crowdcube.com исправен.")
    } catch(err) {
        logger.error("Парсер crowdcube.com неисправен.")
    }
}

async function similarwebDiagnostic(browser: any, logger: ILogger): Promise<void> {
    logger.info("Выполняется проверка парсера similarweb")
    try {
        const project = new Project()
        project.companyName = "diagnostic"
        project.web = "onedox.com"
        //project.web = "fishyfilaments.com"
        const parser = new Similarweb(browser)
        const data = await parser.getData(project)
        logger.info("Парсер similarweb исправен.")
    } catch(err) {
        logger.error("Парсер similarweb неисправен.")
    }
}

async function crunchbaseDiagnostic(browser: any, logger: ILogger): Promise<void> {
    logger.info("Выполняется проверка парсера crunchbase")
    try {
        const project = new Project()
        project.companyName = "onedox"
        const parser = new CrunchbaseParser(browser)
        const data = await parser.getData(project)
        logger.info("Парсер crunchbase исправен.")
    } catch(err) {
        logger.error("Парсер crunchbase неисправен.")
    }
}