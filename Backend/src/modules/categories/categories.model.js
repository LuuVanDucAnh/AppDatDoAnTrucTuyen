import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/database.js'

const Categories = sequelize.define(
  'categories',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [0, 100] },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 255] },
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
    tableName: 'categories',
    timestamps: false,
    underscored: true,
  }
)

export default Categories
