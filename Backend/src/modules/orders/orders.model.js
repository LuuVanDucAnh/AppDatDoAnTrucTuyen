import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/database.js'

const Orders = sequelize.define(
  'orders',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    address_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    food_total: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    delivery_fee: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 255] },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 10] },
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
    tableName: 'orders',
    timestamps: false,
    underscored: true,
  }
)

export default Orders
