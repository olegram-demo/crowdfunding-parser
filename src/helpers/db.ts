import {container} from "../config/config"
import {Connection} from "typeorm"
import ILogger from "../interfaces/logger"
import Project from "../entity/project"

export async function saveProjects(projects: Project[]) : Promise<void> {
    const logger = container.get<ILogger>("ParsersLogger")
    logger.info("Cохраняем проекты в БД.")
    const connection = await container.get<Promise<Connection>>("DB")
    const projectRepository = connection.getRepository(Project)
    let updatedProjectsCount = 0;
    for (let project of projects) {
        const savedProject = await projectRepository.findOne({companyName: project.companyName})
        if (savedProject !== undefined) {
            updatedProjectsCount++
            project.id = savedProject.id
        }

        await connection.manager.save(project)
    }
    
    logger.info(
        'Проекты успешно сохранены! ' + 
        `Добавлено новых: ${projects.length-updatedProjectsCount}. Обновлено существующих: ${updatedProjectsCount}`
    )   
}