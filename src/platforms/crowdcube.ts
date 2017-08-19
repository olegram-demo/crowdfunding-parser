import IPlatform from "../interfaces/platform"
import Project from "../entity/project"
import * as phantom from "phantom"
import {container, settings} from "../config/config"
import ILogger from "../interfaces/logger"
import {randomArrayElement} from "random-array-element-ts"
import CrowdcubeError from "../exceptions/crowdcube"
import * as $$ from "cheerio"
const a = require("awaiting")
const errToJson = require("utils-error-to-json")
var trim = require('condense-whitespace')
declare var $:any
declare var window:any
declare var document:any

export default class Crowdcube implements IPlatform {

    protected readonly PLATFORM_NAME = "crowdcube"
    protected readonly BASE_URL = "https://www.crowdcube.com"
    protected readonly OPERATION_MAX_TRY = 10

    protected browser: phantom.PhantomJS
    protected logger: ILogger
    protected page: phantom.WebPage

    constructor (browser: phantom.PhantomJS)
    {
        this.browser = browser
        this.logger = container.get("ParsersLogger")
    }

    log = (level:string, msg: string): void => {
        this.logger.log(level, `[CROWDCUBE] ${msg}`)
    }

    randomDelay = async (min : number, max: number, log = true): Promise<void> => {
        let delay = Math.random() * (max - min) + min;
        if (log) this.log('info', `Ожидаем ${Math.round(delay/10)/100} сек.`)
        await a.delay(delay)
    }

    getProjects = async () : Promise<Project[]> => {
        try {
            await this.init()
            await this.login();
            let projectsLinks = await this.getProjectsLinks()
            //projectsLinks = projectsLinks.splice(0,1);
            const projectsCount = projectsLinks.length

            const result:Project[] = []
            for (let n = 0; n < projectsCount; ++n) {
                await this.randomDelay(1000, 2000)
                this.log('info', `Обрабатывается проект: ${n+1} из ${projectsCount}`)
                let project = await this.getProject(projectsLinks[n])
                result.push(project)
                this.log('debug', JSON.stringify(project))
            }

            return result
        } catch (err) {
            const msg = "Не удалось получить проекты с crowdcube.com"
            this.log('error', `${msg} ${JSON.stringify(errToJson(err))}`);
            throw new CrowdcubeError(msg)
        }
    }

    protected init = async () : Promise<void> => {
        this.page = await this.browser.createPage()
        await this.page.property('viewportSize', {width: 1024, height: 768});
    }

    protected login = async () : Promise<void> => {
        let currentTry = 1
        do {
            const account = randomArrayElement(settings.crowdcube.accounts)
            let msg = `Выполняем вход (login: ${account.login} password: ${account.password}).`
            if (currentTry > 1) {
                await this.randomDelay(3000, 5000)
                msg += ` (попытка ${currentTry}).`
            }
            this.log('info', msg)

            let status = await this.page.open("https://www.crowdcube.com/login")
            if (status !== "success") {
                this.log('error', "Ошибка при открытии страницы авторизации.")
                continue
            }

            let html = await this.page.property("content")
            if (!this.isLoginPage(html)) {
                this.log('error', "Неизвестная разметка страницы авторизации.")
                //await this.page.render('phantom-screenshot1.png')
                continue
            }

            await this.page.injectJs("node_modules/jquery/dist/jquery.min.js")
            await this.page.evaluate(function(account) {
                $("#input-email").val(account.login);
                $("#input-password").val(account.password);
                $("#login-form").find("button").click();
            }, account);
            
            // TODO Переделать по нормальному
            await a.delay(5000)
            html = await this.page.property("content")
            if (!this.isLoggedIn(html)) {
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

    protected isLoginPage = (html:any) : boolean => {
        return $$(html).find("#login-form").html() !== null
    }

    protected isLoggedIn = (html:any) : boolean => {
        return $$(html).find("div.cc-navigationUser__avatar").length === 1
    }

    protected getProjectsLinks = async () : Promise<Array<string>> => {
        let currentTry = 1
        do {
            let msg = "Получаем список проектов"
            if (currentTry > 1) {
                await this.randomDelay(3000, 5000)
                msg += ` (попытка ${currentTry}).`
            }
            this.log('info', msg)

            let status = await this.page.open("https://www.crowdcube.com/investments")
            if (status !== "success") {
                this.log('error', "Ошибка при открытии страницы со списком проектов.")
                continue
            }

            let html = await this.page.property("content")
            if (!this.isProjectsListPage(html)) {
                this.log('error', "Неизвестная разметка страницы со списком проектов.")
                continue
            }

            if (!this.isLoggedIn(html)) {
                this.log('error', "Не выполнен вход на crowdcube.com")
                break
            }

            let projectsCountBeforeScroll:number
            let projectsCountAfterScroll:number
            do {
                let projectsCountBeforeScroll = this.getProjectsCount(html)
                await this.page.evaluate(function() {
                    window.document.body.scrollTop = document.body.scrollHeight;
                })
                await a.delay(5000)
                html = await this.page.property("content")
                let projectCountAfterScroll = (this.getProjectsCount(html))
            } while (projectsCountBeforeScroll < projectsCountAfterScroll)

            const links = this.extractProjectsLinks(html)
            this.log('info', `Найдено проектов - ${links.length}`)
            return links

        } while (currentTry++ < this.OPERATION_MAX_TRY)
        
        const err = "Не удалось получить список проектов"
        this.log('error', err)
        throw new CrowdcubeError(err)
    }

    protected isProjectsListPage = (html:any) : boolean => {
        return $$(html).find("#cc-opportunities__listContainer").html() !== null
    }

    protected getProjectsCount = (html:any) : number => {
        return $$(html).find(".cc-card__link").length
    }

    protected extractProjectsLinks = (html:any) : Array<string> => {
        const links:Array<string> = []
        $$(html).find(".cc-card__link").each((i, el) => {
            links.push(this.BASE_URL + $$(el).attr("href"))
        })
        this.log('debug', JSON.stringify(links))
        return links
    }

    protected getProject = async (url:string) : Promise<Project> => {
        let currentTry = 1
        do {
            let msg = `Получаем данные по проекту ${url}`
            if (currentTry > 1) {
                await this.randomDelay(3000, 5000)
                msg += `(попытка ${currentTry}).`
            }
            this.log('info', msg)

            // На ссылки полученные со страницы списка проектов стоит 302 редирект.
            // PhantomJS не выполняет его автоматически, поэтому делаем это самостоятельно.
            let redirectUrl = null
            await this.page.on("onResourceReceived", (resource:any) => {
                if (resource.url == url) {
                    // Вариант с for of не прокатит, т.к. данный код выполняется на стороне PhantomJS, а он не поймет
                    for (var n = 0, len = resource.headers.length; n < len; ++n) {
                        if(resource.headers[n]["name"] == "Location") {
                            redirectUrl = this.BASE_URL + resource.headers[n]["value"];
                            break;
                        }
                    }
                }
            })
            let status = await this.page.open(url)
            if (redirectUrl !== null) {
                this.log('info', `Выполняем редирект на ${redirectUrl}`)
                status = await this.page.open(redirectUrl)
            } 

            if (status !== "success") {
                this.log('error', "Ошибка при загрузке страницы проекта.")
                continue
            }

            let html = await this.page.property("content")

            if (!this.isLoggedIn(html)) {
                this.log('error', "Не выполнен вход.")
                break
            }

            if (!this.isProjectPage(html)) {
                this.log('error', "Неизвестная разметка страницы проекта.")
                continue
            }

            this.log('info', "Парсим страницу.")
            let project = this.createProjectFromHtml(html)
            project.platformUrl = url
            return project
        
        } while (currentTry++ < this.OPERATION_MAX_TRY)
        
        const err = `Не удалось получить информацию по проекту ${url}`
        this.log('error', err)
        throw new CrowdcubeError(err)
    }

    protected isProjectPage = (html:any) : boolean => {
        return $$(html).find("#the_financials").html() !== null
    }

    protected createProjectFromHtml = (html:any) : Project => {
        const project = new Project()
        project.platform = this.PLATFORM_NAME,
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
        return trim($$(html).find("div.cc-pitchCover__title").eq(0).text())
    }

    protected getInvestmentType = (html:any) : string => {
        return trim($$(html).find("ul.cc-tagList").find("li").eq(0).find("span").eq(0).text())
    }

    protected getTaxIncentiveType = (html:any) : string => {
        const data:string[] = []
        $$(html).find("ul.cc-tagList").find("li").each(function(i, el) {
            if ($$(el).find("a").length) {
                data.push(trim($$(el).find("span").eq(0).text()))
            }
        })
        return data.join("|")
    }

    protected getDaysLeft = (html:any) : number => {
        const stringVal = trim($$(html).find("dl.cc-daysLeft").eq(0).find("dd").text())
        return parseInt(stringVal)
    }

    protected getAmountRaised = (html:any) : string => {
        return trim($$(html).find("div.cc-pitchHead__statsMain").eq(0).find("dl").eq(0).find("dd").eq(0).text())
    }

    protected getInvestorsCount = (html:any) : number => {
        const stringVal = trim($$(html).find("div.cc-pitchHead__statsMain").eq(0).find("dl").eq(1).find("dd").eq(0).text())
        return parseInt(stringVal)
    }

    protected getTargetAmount = (html:any) : string => {
        return trim($$(html).find("div.cc-pitchHead__statsSecondary").eq(0).find("dl").eq(0).find("dd").eq(0).text())
    }

    protected getEquityFotRound = (html:any) : string => {
        return trim($$(html).find("div.cc-pitchHead__statsSecondary").eq(0).find("dl").eq(1).find("dd").eq(0).text())
    }

    protected getPreMoneyValuation = (html:any) : string => {
        return trim($$(html).find("div.cc-pitchHead__statsSecondary").eq(0).find("dl").eq(2).find("dd").eq(0).text())
    }
    
    protected getShortDescription = (html:any) : string => {
        return trim($$(html).find("#cc-pitchHead").next("div.row").find("section").eq(0).find("p").eq(0).text())
    }

    protected getWeb = (html:any) : string => {
        return $$(html).find("a[title='Website']").eq(0).attr("href")
    }

    protected getTwitter = (html:any) : string => {
        return $$(html).find("a[title='Twitter profile']").eq(0).attr("href")
    }

    protected getInstagram = (html:any) : string => {
        return $$(html).find("a[title='Instagram']").eq(0).attr("href")
    }

    protected getFacebook = (html:any) : string => {
        return $$(html).find("a[title='Facebook page']").eq(0).attr("href")
    }

    protected getRegInfo = (html:any) : string => {
        return $$(html).find("a[title='Companies House']").eq(0).attr("href")
    }
    
    protected getIdea = (html:any) : string => {
        return trim($$(html).find("#the_idea").find("div.row").eq(1).find("div.columns").eq(1).html())
    }

    protected getFinancials = (html:any) : string => {
        return trim($$(html).find("#the_financials").find("div.row").eq(1).find("div.columns").eq(1).html())
    }

    protected getDailyViews = (html:any) : number => {
        const stringVal = $$(html).find("div.cc-pitchActivity").eq(0).find("div.cc-pitchActivity__stat").eq(0).find("dt").text()
        return parseInt(stringVal)
    }

    protected getFollowers = (html:any) : number => {
        const stringVal = $$(html).find("div.cc-pitchActivity").eq(0).find("div.cc-pitchActivity__stat").eq(1).find("dt").text()
        return parseInt(stringVal)
    }

    protected getLargestInvestment = (html:any) : string => {
        return $$(html).find("div.cc-pitchActivity").eq(0).find("div.cc-pitchActivity__stat").eq(3).find("dt").text()
    }

    protected getInvestedToday = (html:any) : string => {
        return $$(html).find("div.cc-pitchActivity").eq(0).find("div.cc-pitchActivity__stat").eq(4).find("dt").text()
    }

    protected getTeamHtml = (html:any) : string => {
        return trim($$(html).find("#the_people").find("div.row").eq(1).find("div.columns").eq(1).html())
    }
    
}