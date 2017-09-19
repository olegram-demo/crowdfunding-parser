import "reflect-metadata"
import Crowdcube from "./parsers/platforms/crowdcube"
import SimilarwebParser from "./parsers/others/similarweb"
import CrunchbaseParser from "./parsers/others/crunchbase"
import ioc from "./config/ioc"
import Project from "./entity/project"
import {saveProjects} from "./helpers/db"
import ILogger from "./interfaces/logger"

(async () => {
    const browser = await ioc.get<Promise<any>>("Browser")
    const logger: ILogger = ioc.get("ParsersLogger")
    try {
        const platform = new Crowdcube(browser)
        const projects = await platform.getProjects()
        
        const similarwebParser = new SimilarwebParser(browser)
        const crunchbaseParser = new CrunchbaseParser(browser)
        let totalProjects = projects.length
        let currentProject = 0
        for (let project of projects) {
            currentProject++
            logger.log('info', `Обрабатывается проект ${currentProject} из ${totalProjects}`)
            
            try {
                project.similarwebData = await similarwebParser.getData(project)
            } catch(err) {}

            try {
                project.crunchbaseData = await crunchbaseParser.getData(project)
            } catch(err) {}
        }

        saveProjects(projects)
    } catch(err) {
        process.exit(1);
    } finally {
        // Костыль, чтобы браузер корректно закрылся
        try {
            const a = require("awaiting")
            await a.delay(2000)
            await browser.close()
        } catch (error) {}
    }
})()