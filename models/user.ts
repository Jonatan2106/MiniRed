import {Table, Column, Model, DataType, HasMany} from "sequelize-typescript";
import {Post} from "./post";
import {Comment} from "./comment";
import {SubredditMember} from "./subreddit_member";

@Table({
    tableName: "user", timestamps: false
})

export class User extends Model {
    @Column({ 
        primaryKey: true,
        allowNull: false,
        type: DataType.UUID
    })
    declare user_id: string;

    @Column({ 
        type: DataType.STRING,
        allowNull: false
    })
    declare username: string;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare email: string;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare password: string;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare profile_pic: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    declare created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    declare updated_at: Date;

    @HasMany(() => Post, { 
        foreignKey: 'user_id' 
    })
    declare posts: Post[];

    @HasMany(() => Comment, { 
        foreignKey: 'user_id' 
    })
    declare comments: Comment[];

    @HasMany(() => SubredditMember, { foreignKey: 'user_id', as: 'joinedSubreddits' })
    declare joinedSubreddits: SubredditMember[];
}