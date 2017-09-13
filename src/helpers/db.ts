import ioc from "../config/ioc"
import {Connection, JoinColumn} from "typeorm"
import ILogger from "../interfaces/logger"
import Project from "../entity/project"
import SimilarwebData from "../entity/similarweb"
import CrunchbaseData from "../entity/crunchbase"

export async function saveProjects(projects: Project[]) : Promise<void> {
    const logger = ioc.get<ILogger>("ParsersLogger")
    logger.info("Cохраняем проекты в БД.")
    const connection = await ioc.get<Promise<Connection>>("DB")
    const projectRepository = connection.getRepository(Project)

    await projectRepository
        .createQueryBuilder("project") 
        .update({isActive: false})
        .execute()
    
    let updatedProjectsCount = 0;
    for (let project of projects) {
        project.isActive = true
        
        const savedProject = await connection.getRepository(Project).createQueryBuilder("project")
            //.leftJoinAndSelect("project.similarwebData", "similarwebData")
            .where("project.companyName = :name", { name: project.companyName })
            .getOne();
    
        if (savedProject == undefined) {
            await connection.manager.save(project)
            continue
        }

        updatedProjectsCount++
        
        connection
            .createQueryBuilder()
            .delete()
            .from(SimilarwebData)
            .where("projectId = :projectId", { projectId: savedProject.id })
            .execute();

        connection
            .createQueryBuilder()
            .delete()
            .from(CrunchbaseData)
            .where("projectId = :projectId", { projectId: savedProject.id })
            .execute();
       
        projectRepository.updateById(savedProject.id, project)
    }
    
    logger.info(
        'Проекты успешно сохранены! ' + 
        `Добавлено новых: ${projects.length-updatedProjectsCount}. Обновлено существующих: ${updatedProjectsCount}`
    )   
}