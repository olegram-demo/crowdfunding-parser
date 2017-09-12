import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn} from "typeorm"
import Project from "./project"

@Entity()
export default class SimilarwebData {

    @OneToOne(type => Project, project => project.similarwebData)
    @JoinColumn()
    project: Project;

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string

    @Column({nullable: true})
    appleUrl: string

    @Column({nullable: true})
    androidUrl: string

    @Column({nullable: true})
    globalRank: number

    @Column({nullable: true})
    countryRank: number

    @Column({nullable: true})
    totalVisits: string

    @Column({nullable: true})
    averageVisitDuration: string
    
    @Column({nullable: true})
    pagesPerVisit: number

    @Column({nullable: true})
    bounceRate: number

    @Column({nullable: true})
    countriesData: string

    @Column({nullable: true})
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