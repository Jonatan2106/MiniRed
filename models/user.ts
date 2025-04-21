import {Table, Column, Model, DataType} from "sequelize-typescript";

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
        type: DataType.ENUM("ADMIN", "USER"),
        allowNull: false
    })
    declare user_type: string;

    @Column({
        type: DataType.BLOB,
        allowNull: false
    })
    declare profile_pic: string;

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