import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/database.js'

const OrderItems = sequelize.define(
  'order_items',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    food_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    food_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [0, 150] },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    note: {
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
  },
  {
    tableName: 'order_items',
    timestamps: false,
    underscored: true,
  }
)

export default OrderItems
