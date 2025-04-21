import {Table, Column, Model, DataType, ForeignKey} from "sequelize-typescript";
import { User } from "./user";
import { Post } from "./post";

@Table({
    tableName: "comment", timestamps: false
})

export class Comment extends Model {
    @Column({ 
        primaryKey: true,
        type: DataType.UUID
    })
    declare comment_id: string;

    @ForeignKey(() => User)
    @Column({ 
        type: DataType.UUID,
        allowNull: false
    })
    declare user_id: string;

    @ForeignKey(() => Post)
    @Column({ 
        type: DataType.UUID,
        allowNull: false
    })
    declare post_id: string;

    @ForeignKey(() => Comment)
    @Column({ 
        type: DataType.UUID,
        allowNull: false
    })
    declare parent_comment_id: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare content: string;

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