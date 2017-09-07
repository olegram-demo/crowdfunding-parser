import "reflect-metadata"
import Crowdcube from "./parsers/platforms/crowdcube"
import ioc from "./config/ioc"
import Project from "./entity/project"
import {saveProjects} from "./helpers/db"

const getProjects = async () : Promise<Project[]> => {
    const browser = await ioc.get<Promise<any>>("Browser")
    try {
        const platform = new Crowdcube(browser)
        const projects = await platform.getProjects()
        return projects
    } catch(err) {
        process.exit(1);
    } finally {
        browser.close()
    }
}

getProjects().then(projects => {
    saveProjects(projects);
})