import {Table, Column, Model, DataType, ForeignKey, HasMany, BelongsTo} from "sequelize-typescript";
import { User } from "./user";
import { Subreddit } from "./subreddit";
import { Vote } from "./vote";
import { Comment } from "./comment";

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
        allowNull: true
    })
    declare subreddit_id?: string;

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
        allowNull: true
    })
    declare image: Blob;

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

    @HasMany(() => Vote, {
        foreignKey: "kategori_id",
        constraints: false,
        scope: {
            kategori_type: "POST"
        }
    })
    declare votes: Vote[];

    @HasMany(() => Comment, {
        foreignKey: 'post_id'
    })
    declare comments: Comment[];

    @BelongsTo(() => User, { 
        foreignKey: 'user_id' 
    })
    declare user: User;

    @BelongsTo(() => Subreddit, {
        foreignKey: "subreddit_id",
    })
    declare subreddit: Subreddit;
}