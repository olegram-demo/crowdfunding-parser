import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne} from "typeorm"
import SimilarwebData from "./similarweb"
import CrunchbaseData from "./crunchbase"

@Entity()
export default class Project {

    @OneToOne(type => SimilarwebData, similarwebData => similarwebData.project, {
        cascadeAll: true,
    })
    similarwebData: SimilarwebData;

    @OneToOne(type => CrunchbaseData, crunchbaseData => crunchbaseData.project, {
        cascadeAll: true,
    })
    crunchbaseData: CrunchbaseData;

    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    platform: string

    @Column({nullable: true})
    platformUrl: string

    @Column()
    companyName: string

    @Column({nullable: true})
    investmentType: string

    @Column({nullable: true})
    taxIncentiveType: string

    @Column({nullable: true})
    daysLeft: number

    @Column({nullable: true})
    amountRaised: string
    
    @Column({nullable: true})
    investorsCount: number

    @Column({nullable: true})
    targetAmount: string

    @Column({nullable: true})
    equityForRound: string

    @Column({nullable: true})
    preMoneyValuation: string

    @Column({nullable: true})
    shortDescription: string
    
    @Column({nullable: true})
    web: string

    @Column({nullable: true})
    twitter: string

    @Column({nullable: true})
    facebook: string

    @Column({nullable: true})
    instagram: string

    @Column({nullable: true})
    regInfo: string

    @Column({nullable: true})
    idea: string

    @Column({nullable: true})
    financials: string

    @Column({nullable: true})
    ​​dailyViews: number

    @Column({nullable: true})
    ​​followers: number

    @Column({nullable: true})
    largestInvestment: string

    @Column({nullable: true})
    ​​investedToday: string

    @Column({nullable: true})
    ​​teamHtml: string

    @Column({nullable: true})
    isActive: boolean

    @CreateDateColumn()
    createdAt: string

    @UpdateDateColumn()
    updatedAt: string
}