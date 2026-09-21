import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/database.js'

const Users = sequelize.define(
  'users',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [0, 100] },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 100] },
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [0, 15] },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [0, 255] },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 16] },
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: false,
    underscored: true,
  }
)

export default Users
