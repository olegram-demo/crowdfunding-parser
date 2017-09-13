import ParserBase from "../parser-base"
import Project from "../../entity/project"
import {randomArrayElement} from "random-array-element-ts"
import settings from "../../config/config"
declare var window:any
declare var document:any
import * as $ from "cheerio"
import CrunchbaseError from "../../exceptions/crunchbase"
import crunchbaseData from "../../entity/crunchbase"

export default class CrunchbaseParser extends ParserBase {
    
    protected name = "crunchbase"
    protected readonly BASE_URL = "https://www.crunchbase.com"

    protected readonly OPERATION_MAX_TRY = 5

    getData = async (project: Project) : Promise<any> => {
        
        const page = await this.browser.newPage()
        await page.setUserAgent(randomArrayElement(settings.browser.userAgent))
        await page.setViewport(settings.browser.defaultPageSize)

        let currentTry = 1
        do {
            let msg = `Получаем данные по проекту ${project.companyName}`
            if (currentTry > 1) {
                await this.randomDelay(3000, 5000)
                msg += ` (попытка ${currentTry}).`
            }
            this.log('info', msg)

            try {
                await page.goto(this.getResolvedUrl(project), {timeout: settings.browser.timeout});
            } catch(e) {
                this.log('error', "Ошибка при открытии страницы проекта.")
                continue
            }

            const html = await page.content()

            if (this.is404Page(html)) {
                const err = `Проект ${project.companyName} не найден на crunchbase.`
                this.log('error', err)
                throw new CrunchbaseError(err)
            }

            if (!this.isProjectPage(html)) {
                this.log('error', "Неизвестная разметка страницы проекта.")
                continue
            }

            const crunchbaseData = this.createEntityFromHtml(await page.content())
            crunchbaseData.url = page.url()

            this.log('debug', JSON.stringify(crunchbaseData))
            return crunchbaseData

        } while (currentTry++ < this.OPERATION_MAX_TRY)
    }

    protected getResolvedUrl(project: Project) {
        let preparedName = project.companyName.replace( / /g, '-')
        return `${this.BASE_URL}/organization/${preparedName}`.toLowerCase()
    }

    protected is404Page = (html:any): boolean => {
        return $(html).find("#error-404").html() !== null
    }

    protected isProjectPage = (html:any): boolean => {
        return $(html).find("#profile_header_heading").html() !== null
    }

    protected createEntityFromHtml = (html:any) : crunchbaseData => {
        const entity = new crunchbaseData()
        
        entity.foundedDate = this.getFoundedDate(html)
        entity.employeesCount = this.getEmployeesCount(html)
        entity.categories = JSON.stringify(this.getCategories(html))
        entity.numberOfRounds = this.getNumberOfRounds(html)
        entity.members = JSON.stringify(this.getMembers(html))
        
        return entity
    }

    protected getFoundedDate = (html:any) : string => {
        return $(html).find("div.details").find("dt:contains('Founded:')").next().text()
    }

    protected getEmployeesCount = (html:any) : string => {
        return $(html).find("div.details").find("dt:contains('Employees:')").next().text()
    }

    protected getCategories = (html:any) : string[] => {
        const categories:string[] = []
        $(html).find("div.definition-list").find("dt:contains('Categories:')").next().find("a").each((i, el) => {
            categories.push($(el).text())
        })
        return categories
    }

    protected getNumberOfRounds = (html:any) : number => {
        let value = $(html).find("#funding_rounds").find("span").text()
        return parseInt(value.replace( /^\D+/g, ''))
    }

    protected getMembers = (html:any) : any[] => {
        const members:any[] = []
        $(html).find("div.people").find("ul").find("li").each((i, el) => {
            const nameEl = $(el).find("h4")
            const url = this.BASE_URL + $(nameEl).find("a").attr("href")
            const name = $(nameEl).text()
            const position = $(el).find("h5").text()
            members.push({url, name, position})
        })
        return members
    }
}        