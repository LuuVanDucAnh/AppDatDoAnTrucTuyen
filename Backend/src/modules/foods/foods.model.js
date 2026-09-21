import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/database.js'

const Foods = sequelize.define(
  'foods',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 255] },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [0, 12] },
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
    tableName: 'foods',
    timestamps: false,
    underscored: true,
  }
)

export default Foods
