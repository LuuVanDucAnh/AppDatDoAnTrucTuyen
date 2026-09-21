import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/database.js'

const Payments = sequelize.define(
  'payments',
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
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 13] },
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 8] },
    },
    transaction_code: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 100] },
    },
    payment_date: {
      type: DataTypes.DATE,
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
  },
  {
    tableName: 'payments',
    timestamps: false,
    underscored: true,
  }
)

export default Payments
