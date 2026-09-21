import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/database.js'

const Restaurants = sequelize.define(
  'restaurants',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [0, 150] },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: { len: [0, 65535] },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [0, 255] },
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 15] },
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 255] },
    },
    opening_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    closing_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 18] },
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
    tableName: 'restaurants',
    timestamps: false,
    underscored: true,
  }
)

export default Restaurants
