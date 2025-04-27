import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "./user";
import { Subreddit } from "./subreddit";
@Table({
    tableName: "subreddit_member", timestamps: false
})

export class SubredditMember extends Model {
    @ForeignKey(() => Subreddit)
    @Column({
        primaryKey: true,
        allowNull: true,
        type: DataType.UUID
    })
    declare subreddit_id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        allowNull: false
    })
    declare user_id: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    declare joined_at: Date;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    declare is_moderator: boolean;

    @BelongsTo(() => Subreddit)
    declare subreddit: Subreddit;
}