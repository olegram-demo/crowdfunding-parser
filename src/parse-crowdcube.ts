import "reflect-metadata"
import Crowdcube from "./platforms/crowdcube"
import {container} from "./config/config"
import * as phantom from "phantom"
import Project from "./entity/project"
import {saveProjects} from "./helpers/db"

const getProjects = async () : Promise<Project[]> => {
    const browser = await container.get<Promise<phantom.PhantomJS>>("Browser")
    try {
        const platform = new Crowdcube(browser)
        const projects = await platform.getProjects()
        return projects
    } catch(err) {
        process.exit(1);
    } finally {
        browser.exit()
    }
}

getProjects().then(projects => {
    saveProjects(projects);
})