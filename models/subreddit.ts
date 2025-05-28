import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import { User } from "./user";
import { SubredditMember } from "./subreddit_member";
import { Post } from "./post";

@Table({
    tableName: "subreddit",
    timestamps: false
})
export class Subreddit extends Model {
    @Column({
        primaryKey: true,
        allowNull: false,
        type: DataType.UUID
    })
    declare subreddit_id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare user_id: string;

    @Column({  //url
        type: DataType.STRING,
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare title: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare description: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    declare created_at: Date;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    declare is_privated: boolean;

    @BelongsTo(() => User, {
        foreignKey: 'user_id'
    })
    declare user: User;

    @HasMany(() => SubredditMember, { foreignKey: 'subreddit_id' })
    declare members: SubredditMember[];

    @HasMany(() => Post, {
        foreignKey: 'subreddit_id'
    })
    declare posts: Post[];
}
