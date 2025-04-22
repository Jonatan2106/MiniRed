import {Table, Column, Model, DataType, ForeignKey} from "sequelize-typescript";
import { User } from "./user";
import { Subreddit } from "./subreddit";

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
        type: DataType.UUID,
        allowNull: false
    })
    declare user_id: string;

    @ForeignKey(() => Subreddit)
    @Column({ 
        type: DataType.UUID,
        allowNull: false
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
    declare image: Blob;

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