import "reflect-metadata"
import Crowdcube from "./parsers/platforms/crowdcube"
import SimilarwebParser from "./parsers/others/similarweb"
import CrunchbaseParser from "./parsers/others/crunchbase"
import ioc from "./config/ioc"
import Project from "./entity/project"
import {saveProjects} from "./helpers/db"

(async () => {
    const browser = await ioc.get<Promise<any>>("Browser")
    try {
        const platform = new Crowdcube(browser)
        const projects = await platform.getProjects()
        
        const similarwebParser = new SimilarwebParser(browser)
        const crunchbaseParser = new CrunchbaseParser(browser)
        for (let project of projects) {
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
        browser.close()
    }
})()




