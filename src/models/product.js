import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

const Product = sequelize.define("Product", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  imageKey: { type: DataTypes.STRING },
  imageUrl: { type: DataTypes.STRING },
  uniqueId: { type: DataTypes.STRING, unique: true, defaultValue: () => uuidv4() },
});

export default Product;
