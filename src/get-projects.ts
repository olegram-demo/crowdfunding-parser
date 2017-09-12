import "reflect-metadata"
import Crowdcube from "./parsers/platforms/crowdcube"
import Similarweb from "./parsers/others/similarweb"
import ioc from "./config/ioc"
import Project from "./entity/project"
import {saveProjects} from "./helpers/db"

(async () => {
    const browser = await ioc.get<Promise<any>>("Browser")
    try {
        const platform = new Crowdcube(browser)
        const projects = await platform.getProjects()
        
        const similarweb = new Similarweb(browser)
        for (let project of projects) {
            try {
                project.similarwebData = await similarweb.getData(project)
            } catch(err) {
                continue   
            } finally {
                await similarweb.randomDelay(4000, 7000)
            }
        }

        saveProjects(projects)
    } catch(err) {
        process.exit(1);
    } finally {
        browser.close()
    }
})()




