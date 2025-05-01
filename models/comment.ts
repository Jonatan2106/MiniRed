import {Table, Column, Model, DataType, ForeignKey, HasMany, BelongsTo} from "sequelize-typescript";
import { User } from "./user";
import { Post } from "./post";
import { Vote } from "./vote";

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
        allowNull: true,
        onDelete: 'CASCADE'
    })
    declare parent_comment_id: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare content: string;

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

    @HasMany(() => Comment, { 
        foreignKey: 'parent_comment_id',
        as: 'replies',
        onDelete: 'CASCADE'
      })
      declare replies: Comment[];      

    @HasMany(() => Vote, {
        foreignKey: "kategori_id",
        constraints: false,
        scope: {
            kategori_type: "COMMENT"
        }
    })
    declare votes: Vote[];    

    @BelongsTo(() => User, { 
            foreignKey: 'user_id' 
        })
    declare user: User;

    @BelongsTo(() => Post, {
        foreignKey: 'post_id'
    })
    declare post: Post;
}