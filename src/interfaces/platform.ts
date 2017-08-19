import Project from "../entity/project"

export default interface IPlatform {
    getProjects (): Promise<Project[]>
}