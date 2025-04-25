import {Table, Column, Model, DataType, ForeignKey, BelongsTo} from "sequelize-typescript";
import { User } from "./user";
import { Post } from "./post";
import { Comment } from "./comment";

@Table({
    tableName: "vote", timestamps: false
})

export class Vote extends Model {
    @Column({ 
        primaryKey: true,
        allowNull: false,
        type: DataType.UUID
    })
    declare vote_id: string;

    @ForeignKey(() => User)
    @Column({ 
        type: DataType.UUID,
        allowNull: false
    })
    declare user_id: string;

    @Column({ 
        type: DataType.UUID,
        allowNull: false
    })
    declare kategori_id: string;

    @Column({ 
        type: DataType.ENUM("POST", "COMMENT"),
        allowNull: false
    })
    declare kategori_type: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true
    })
    declare vote_type: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    declare created_at: Date;

    @BelongsTo(() => Post, {
        foreignKey: "kategori_id",
        constraints: false
    })
    declare post?: Post;

    @BelongsTo(() => Comment, {
        foreignKey: "kategori_id",
        constraints: false
    })
    declare comment?: Comment;
}