import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn} from "typeorm"
import Project from "./project"

@Entity()
export default class CrunchbaseData {

    @OneToOne(type => Project, project => project.crunchbaseData)
    @JoinColumn()
    project: Project;

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string

    @Column({nullable: true})
    foundedDate: string

    @Column({nullable: true})
    employeesCount: string

    @Column({nullable: true})
    categories: string

    @Column({nullable: true})
    numberOfRounds: number

    @Column({nullable: true})
    members: string

    @CreateDateColumn()
    createdAt: string

    @UpdateDateColumn()
    updatedAt: string
    
}