import {Table, Column, Model, DataType, AllowNull} from "sequelize-typescript";

@Table({
    tableName: "subreddit", timestamps: false
})

export class Subreddit extends Model {
    @Column({ 
        primaryKey: true,
        allowNull: true,
        type: DataType.UUID
    })
    declare subreddit_id: string;

    @Column({ 
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
        type: DataType.STRING,
        allowNull: false
    })
    declare url: string;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    declare created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    declare created_by: Date;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    declare ls_private: string;
}