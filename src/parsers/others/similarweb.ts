import ParserBase from "../parser-base"
import * as $ from "cheerio"
import SimilarwebError from "../../exceptions/similarweb"
import {randomArrayElement} from "random-array-element-ts"
import settings from "../../config/config"
import SimilarwebData from "../../entity/similarweb"
var trim = require('condense-whitespace')
import Project from "../../entity/project"
const errToJson = require("utils-error-to-json")

export default class Similarweb extends ParserBase {
    
    protected name = "similarweb"
    protected readonly BASE_URL = "https://www.similarweb.com"

    protected readonly OPERATION_MAX_TRY = 5

    getData = async (project: Project) : Promise<SimilarwebData> => {
        const searchString = project.web

        const page = await this.browser.newPage()
        await page.setUserAgent(randomArrayElement(settings.browser.userAgent))
        await page.setViewport(settings.browser.defaultPageSize)

        let currentTry = 1
        do {
            let msg = `Получаем статистику по проекту ${searchString}`
            if (currentTry > 1) {
                await this.randomDelay(3000, 5000)
                msg += ` (попытка ${currentTry}).`
            }
            this.log('info', msg)

            page.goto(`${this.BASE_URL}/website/${searchString}`, {timeout: settings.browser.timeout});
            try {
                await page.waitForSelector('.stickyHeader-nameText', {timeout: 10000})
            } catch(e) {
                if (this.isNotInDatabase(await page.content())) {
                    const err = `Сайта ${searchString} нет в базе similarweb.`
                    this.log('error', err)
                    throw new SimilarwebError(err)
                }
                this.log('error', "Неизвестная разметка страницы статистики.")
                continue
            }

            const similarwebData = this.createEntityFromHtml(await page.content())
            similarwebData.url = page.url()

            if (similarwebData.androidUrl !== null) {
                const androidAppData = await this.getAndroidData(similarwebData.androidUrl, page)
                similarwebData.androidInstalls = androidAppData.installs
                similarwebData.androidRating = androidAppData.rating
                similarwebData.androidVotes = androidAppData.votes
            }
            this.log('debug', JSON.stringify(similarwebData))
            return similarwebData

        } while (currentTry++ < this.OPERATION_MAX_TRY)
            
        const err = `Не удалось получить статистику по ${searchString}`
        this.log('error', err)
        throw new SimilarwebError(err)
    }

    protected isNotInDatabase = (html:any): boolean => {
        return $(html).find(".error-search-title") !== null
    }

    protected createEntityFromHtml = (html:any) : SimilarwebData => {
        const entity = new SimilarwebData()
        entity.appleUrl = this.getAppleUrl(html)
        entity.androidUrl = this.getAndroidUrl(html)
        entity.globalRank = this.getGlobalRank(html)
        entity.countryRank = this.getCountryRank(html)
        entity.totalVisits = this.getTotalVisits(html)
        entity.averageVisitDuration = this.getAverageVisitDuration(html)
        entity.pagesPerVisit = this.getPagesPerVisit(html)
        entity.bounceRate = this.getBounceRate(html)
        entity.countriesData = this.getCountriesData(html)
        entity.trafficData = this.getTrafficData(html)

        return entity
    }

    protected getAppleUrl = (html:any) : string => {
        const href = $(html).find("div.stickyHeader-storeName:contains('App Store')").next().attr("href")
        return href == undefined ? null : this.BASE_URL + href
    }

    protected getAndroidUrl = (html:any) : string => {
        const href = $(html).find("div.stickyHeader-storeName:contains('Google Play')").next().attr("href")
        return href == undefined ? null : this.BASE_URL + href
    }

    protected getGlobalRank = (html:any) : number => {
        let rankStr = $(html).find("span.rankingItem-value").eq(0).text()
        return parseInt(rankStr.replace(/,/g, ''))
    }

    protected getCountryRank = (html:any) : number => {
        let rankStr = $(html).find("span.rankingItem-value").eq(1).text()
        return parseInt(rankStr.replace(/,/g, ''))
    }

    protected getTotalVisits = (html:any) : string => {
        return $(html).find("span.engagementInfo-valueNumber").eq(0).text()
    }

    protected getAverageVisitDuration = (html:any) : string => {
        return $(html).find("span.engagementInfo-valueNumber").eq(1).text()
    }

    protected getPagesPerVisit = (html:any) : number => {
        return parseFloat($(html).find("span.engagementInfo-valueNumber").eq(2).text())
    }

    protected getBounceRate = (html:any) : number => {
        return parseFloat($(html).find("span.engagementInfo-valueNumber").eq(3).text())
    }

    protected getCountriesData = (html:any) : string => {
        const data: any = {}
        $(html).find("div.countries-list > div.accordion-group").each((i, el) => {
            const country = $(el).find("a.country-name").text()
            const value = $(el).find("span.traffic-share-valueNumber").text()
            data[country] = value
        })
        return JSON.stringify(data)
    }

    protected getTrafficData = (html:any) : string => {
        const data: any = {}
        $(html).find("ul.trafficSourcesChart-list > li.trafficSourcesChart-item").each((i, el) => {
            const title = trim($(el).find("div.trafficSourcesChart-title").text())
            const value = $(el).find("div.trafficSourcesChart-value").text()
            data[title] = value
        })
        return JSON.stringify(data)
    }

    protected getAndroidData = async (url: string, page: any): Promise<any> => {
        let currentTry = 1
        do {
            let msg = 'Получаем статистику по android приложению.'
            if (currentTry > 1) {
                await this.randomDelay(3000, 5000)
                msg += ` (попытка ${currentTry}).`
            }
            this.log('info', msg)
        
            page.goto(url);
            try {
                await page.waitForSelector('div.appAnalysisHeader-aboutInner', {timeout: 10000})
            } catch(e) {
                this.log('error', "Неизвестная разметка страницы статистики android приложения.")
                continue
            }

            const html = await page.content()
            const installs = $(html).find("span.appAnalysisHeader-infoCount").text()
            const rating = parseFloat($(html).find("div.appAnalysisHeader-rating").find("span").eq(1).text())
            const votes = parseInt($(html).find("span.appAnalysisHeader-ratingVotes > span").text())

            return {installs, rating, votes}

        } while (currentTry++ < this.OPERATION_MAX_TRY)
            
        const err = 'Не удалось получить статистику по android приложению'
        this.log('error', err)
        throw new SimilarwebError(err)
    }
    
}