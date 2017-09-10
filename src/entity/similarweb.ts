import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn} from "typeorm"

@Entity()
export default class SimilarwebData {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string

    @Column({nullable: true})
    appleUrl: string

    @Column({nullable: true})
    androidUrl: string

    @Column()
    globalRank: number

    @Column()
    countryRank: number

    @Column()
    totalVisits: string

    @Column()
    averageVisitDuration: string
    
    @Column()
    pagesPerVisit: number

    @Column()
    bounceRate: number

    @Column()
    countriesData: string

    @Column()
    trafficData: string

    @Column({nullable: true})
    androidInstalls: string

    @Column({nullable: true})
    androidRating: number

    @Column({nullable: true})
    androidVotes: number

    @CreateDateColumn()
    createdAt: string

    @UpdateDateColumn()
    updatedAt: string
    
}