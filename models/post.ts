import {Table, Column, Model, DataType, ForeignKey} from "sequelize-typescript";
import { User } from "./user";

@Table({
    tableName: "post", timestamps: false
})

export class Post extends Model {
    @Column({ 
        primaryKey: true,
        type: DataType.UUID
    })
    declare post_id: string;

    @ForeignKey(() => User)
    @Column({ 
        primaryKey: true,
        type: DataType.UUID
    })
    declare user_id: string;

    @ForeignKey(() => Subreddit)
    @Column({ 
        primaryKey: true,
        type: DataType.UUID
    })
    declare subreddit_id: string;

    @Column({ 
        type: DataType.STRING,
        allowNull: false
    })
    declare title: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare content: string;
    
    @Column({
        type: DataType.BLOB,
        allowNull: false
    })
    declare image: string;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    declare created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    declare updated_at: Date;


}