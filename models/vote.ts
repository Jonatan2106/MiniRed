import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "./user";
import { Post } from "./post";
import { Comment } from "./comment";

@Table({
    tableName: "vote",
    timestamps: false
})
export class Vote extends Model {
    @Column({ 
        primaryKey: true,
        type: DataType.UUID,
        allowNull: false
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
    declare kategori_type: "POST" | "COMMENT"; 

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    declare vote_type: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
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
