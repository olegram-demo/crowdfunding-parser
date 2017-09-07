import ParserBase from "../parser-base"
import IPlatform from "../../interfaces/platform"
import Project from "../../entity/project"
import settings from "../../config/config"
import ioc from "../../config/ioc"
import {randomArrayElement} from "random-array-element-ts"
import CrowdcubeError from "../../exceptions/crowdcube"
import * as $ from "cheerio"
const errToJson = require("utils-error-to-json")
var trim = require('condense-whitespace')
declare var window:any
declare var document:any

export default class Crowdcube extends ParserBase  implements IPlatform {

    protected name = "crowdcube"
    
    protected readonly BASE_URL = "https://www.crowdcube.com"
    protected readonly OPERATION_MAX_TRY = 5

    getProjects = async (limit: number = 0) : Promise<Project[]> => {
        const page = await this.browser.newPage()
        await page.setUserAgent(randomArrayElement(settings.browser.userAgent))
        await page.setViewport(settings.browser.defaultPageSize)
        try {
            await this.login(page);
            let projectsLinks = await this.getProjectsLinks(page)
            if (limit !== 0) projectsLinks = projectsLinks.splice(0, limit);
            const projectsCount = projectsLinks.length

            const result:Project[] = []
            for (let n = 0; n < projectsCount; ++n) {
                await this.randomDelay(1000, 2000)
                this.log('info', `Обрабатывается проект: ${n+1} из ${projectsCount}`)
                let project = await this.getProject(projectsLinks[n], page)
                result.push(project)
                this.log('debug', JSON.stringify(project))
            }
            return result
        } catch (err) {
            const msg = "Не удалось получить проекты с crowdcube.com"
            this.log('error', `${msg} ${JSON.stringify(errToJson(err))}`);
            throw new CrowdcubeError(msg)
        } finally {
            // Почему-то не работает. Надо разбираться
            // await page.close()
        }
    }

    protected login = async (page: any) : Promise<void> => {
        let currentTry = 1
        do {
            const account = randomArrayElement(settings.crowdcube.accounts)
            let msg = `Выполняем вход (login: ${account.login} password: ${account.password}).`
            if (currentTry > 1) {
                await this.randomDelay(3000, 5000)
                msg += ` (попытка ${currentTry}).`
            }
            this.log('info', msg)

            try {
                await page.goto(`${this.BASE_URL}/login`, {timeout: settings.browser.timeout});
            } catch(e) {
                this.log('error', "Ошибка при открытии страницы авторизации.")
                continue
            }

            try {
                await page.waitForSelector('#login-form', {timeout: 3000})
            } catch(e) {
                this.log('error', "Неизвестная разметка страницы авторизации.")
                continue
            }
            
            await page.evaluate((acc:any) => {
                document.getElementById("input-email").value = acc.login
                document.getElementById("input-password").value = acc.password
            }, account);

            await page.click('form button[type=submit]')
            
            try {
                await page.waitForSelector('div.cc-navigationUser__avatar', {timeout: 5000})
            } catch(e) {
                this.log('error', `Не удалось выполнить вход под login: ${account.login} password: ${account.password}`)
                continue
            }
            
            this.log('info', `Успешно выполнен вход под login: ${account.login} password: ${account.password}`)
            return

        } while (currentTry++ < this.OPERATION_MAX_TRY)
        
        const err = "Не удалось выполнить вход на crowdcube.com";
        this.log('error', err)
        throw new CrowdcubeError(err)
    }

    protected getProjectsLinks = async (page: any) : Promise<Array<string>> => {
        let currentTry = 1
        do {
            let msg = "Получаем список проектов"
            if (currentTry > 1) {
                await this.randomDelay(3000, 5000)
                msg += ` (попытка ${currentTry}).`
            }
            this.log('info', msg)

            try {
                await page.goto(`${this.BASE_URL}/investments`, {timeout: settings.browser.timeout});
            } catch(e) {
                this.log('error', "Ошибка при открытии страницы со списком проектов.")
                continue
            }

            try {
                await page.waitForSelector('#cc-opportunities__listContainer', {timeout: 2000})
            } catch(e) {
                this.log('error', "Неизвестная разметка страницы со списком проектов.")
                continue
            }
            
            try {
                await page.waitForSelector('div.cc-navigationUser__avatar', {timeout: 2000})
            } catch(e) {
                this.log('error', "Не выполнен вход на crowdcube.com.")
                continue
            }

            let projectsCountBeforeScroll:number
            let projectsCountAfterScroll:number
            do {
                let projectsCountBeforeScroll = this.getProjectsCount(await page.content())
                await page.evaluate(() => {
                    window.document.body.scrollTop = document.body.scrollHeight
                });
                await this.delay(4000)
                let projectCountAfterScroll = (this.getProjectsCount(await page.content()))
            } while (projectsCountBeforeScroll < projectsCountAfterScroll)

            const links = this.extractProjectsLinks(await page.content())
            this.log('info', `Найдено проектов - ${links.length}`)
            return links

        } while (currentTry++ < this.OPERATION_MAX_TRY)
        
        const err = "Не удалось получить список проектов"
        this.log('error', err)
        throw new CrowdcubeError(err)
    }

    protected getProjectsCount = (html:any) : number => {
        return $(html).find(".cc-card__link").length
    }

    protected extractProjectsLinks = (html:any) : Array<string> => {
        const links:Array<string> = []
        $(html).find(".cc-card__link").each((i, el) => {
            links.push(this.BASE_URL + $(el).attr("href"))
        })
        this.log('debug', JSON.stringify(links))
        return links
    }

    protected getProject = async (url:string, page: any) : Promise<Project> => {
        let currentTry = 1
        do {
            let msg = `Получаем данные по проекту ${url}`
            if (currentTry > 1) {
                await this.randomDelay(3000, 5000)
                msg += `(попытка ${currentTry}).`
            }
            this.log('info', msg)

            try {
                await page.goto(url, {timeout: settings.browser.timeout});
            } catch(e) {
                this.log('error', "Ошибка при загрузке страницы проекта.")
                continue
            }

            try {
                await page.waitForSelector('#the_financials', {timeout: 2000})
            } catch(e) {
                this.log('error', "Неизвестная разметка страницы проекта.")
                continue
            }

            try {
                await page.waitForSelector('div.cc-navigationUser__avatar', {timeout: 2000})
            } catch(e) {
                this.log('error', "Не выполнен вход на crowdcube.com.")
                continue
            }

            this.log('info', "Парсим страницу.")
            let project = this.createProjectFromHtml(await page.content())
            project.platformUrl = url
            return project
        
        } while (currentTry++ < this.OPERATION_MAX_TRY)
        
        const err = `Не удалось получить информацию по проекту ${url}`
        this.log('error', err)
        throw new CrowdcubeError(err)
    }

    protected createProjectFromHtml = (html:any) : Project => {
        const project = new Project()
        project.platform = this.name,
        project.companyName = this.getCompanyName(html)
        project.investmentType = this.getInvestmentType(html)
        project.taxIncentiveType = this.getTaxIncentiveType(html)
        project.daysLeft = this.getDaysLeft(html)
        project.amountRaised = this.getAmountRaised(html)
        project.investorsCount = this.getInvestorsCount(html)
        project.targetAmount = this.getTargetAmount(html)
        project.equityForRound = this.getEquityFotRound(html)
        project.preMoneyValuation = this.getPreMoneyValuation(html)
        project.shortDescription = this.getShortDescription(html)
        project.web = this.getWeb(html)
        project.twitter = this.getTwitter(html)
        project.instagram = this.getInstagram(html)
        project.facebook = this.getFacebook(html)
        project.regInfo = this.getRegInfo(html)
        project.idea = this.getIdea(html)
        project.financials = this.getFinancials(html)
        project.dailyViews = this.getDailyViews(html)
        project.followers = this.getFollowers(html)
        project.largestInvestment = this.getLargestInvestment(html)
        project.investedToday = this.getInvestedToday(html)
        project.teamHtml = this.getTeamHtml(html)

        return project
    }

    protected getCompanyName = (html:any) : string => {
        return trim($(html).find("div.cc-pitchCover__title").eq(0).text())
    }

    protected getInvestmentType = (html:any) : string => {
        return trim($(html).find("ul.cc-tagList").find("li").eq(0).find("span").eq(0).text())
    }

    protected getTaxIncentiveType = (html:any) : string => {
        const data:string[] = []
        $(html).find("ul.cc-tagList").find("li").each(function(i, el) {
            if ($(el).find("a").length) {
                data.push(trim($(el).find("span").eq(0).text()))
            }
        })
        return data.join("|")
    }

    protected getDaysLeft = (html:any) : number => {
        const stringVal = trim($(html).find("dl.cc-daysLeft").eq(0).find("dd").text())
        return parseInt(stringVal)
    }

    protected getAmountRaised = (html:any) : string => {
        return trim($(html).find("div.cc-pitchHead__statsMain").eq(0).find("dl").eq(0).find("dd").eq(0).text())
    }

    protected getInvestorsCount = (html:any) : number => {
        const stringVal = trim($(html).find("div.cc-pitchHead__statsMain").eq(0).find("dl").eq(1).find("dd").eq(0).text())
        return parseInt(stringVal)
    }

    protected getTargetAmount = (html:any) : string => {
        return trim($(html).find("div.cc-pitchHead__statsSecondary").eq(0).find("dl").eq(0).find("dd").eq(0).text())
    }

    protected getEquityFotRound = (html:any) : string => {
        return trim($(html).find("div.cc-pitchHead__statsSecondary").eq(0).find("dl").eq(1).find("dd").eq(0).text())
    }

    protected getPreMoneyValuation = (html:any) : string => {
        return trim($(html).find("div.cc-pitchHead__statsSecondary").eq(0).find("dl").eq(2).find("dd").eq(0).text())
    }
    
    protected getShortDescription = (html:any) : string => {
        return trim($(html).find("#cc-pitchHead").next("div.row").find("section").eq(0).find("p").eq(0).text())
    }

    protected getWeb = (html:any) : string => {
        return $(html).find("a[title='Website']").eq(0).attr("href")
    }

    protected getTwitter = (html:any) : string => {
        return $(html).find("a[title='Twitter profile']").eq(0).attr("href")
    }

    protected getInstagram = (html:any) : string => {
        return $(html).find("a[title='Instagram']").eq(0).attr("href")
    }

    protected getFacebook = (html:any) : string => {
        return $(html).find("a[title='Facebook page']").eq(0).attr("href")
    }

    protected getRegInfo = (html:any) : string => {
        return $(html).find("a[title='Companies House']").eq(0).attr("href")
    }
    
    protected getIdea = (html:any) : string => {
        return trim($(html).find("#the_idea").find("div.row").eq(1).find("div.columns").eq(1).html())
    }

    protected getFinancials = (html:any) : string => {
        return trim($(html).find("#the_financials").find("div.row").eq(1).find("div.columns").eq(1).html())
    }

    protected getDailyViews = (html:any) : number => {
        const stringVal = $(html).find("div.cc-pitchActivity").eq(0).find("div.cc-pitchActivity__stat").eq(0).find("dt").text()
        return parseInt(stringVal)
    }

    protected getFollowers = (html:any) : number => {
        const stringVal = $(html).find("div.cc-pitchActivity").eq(0).find("div.cc-pitchActivity__stat").eq(1).find("dt").text()
        return parseInt(stringVal)
    }

    protected getLargestInvestment = (html:any) : string => {
        return $(html).find("div.cc-pitchActivity").eq(0).find("div.cc-pitchActivity__stat").eq(3).find("dt").text()
    }

    protected getInvestedToday = (html:any) : string => {
        return $(html).find("div.cc-pitchActivity").eq(0).find("div.cc-pitchActivity__stat").eq(4).find("dt").text()
    }

    protected getTeamHtml = (html:any) : string => {
        return trim($(html).find("#the_people").find("div.row").eq(1).find("div.columns").eq(1).html())
    }
    
}