import { DataTypes } from "sequelize";
import  sequelize  from "../config/db.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING },
  password: { type: DataTypes.TEXT },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  otp: { type: DataTypes.STRING },
  otpExpires: { type: DataTypes.BIGINT },
});

export default User;
