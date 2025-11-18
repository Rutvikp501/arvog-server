import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();


const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dialect: "postgres",
    logging: false,
  }
);

export default sequelize;


export const PGConnection = async () => {
  try {
    
    await sequelize.authenticate();
    console.log("📦 DATABASE CONNECTED (Sequelize + Postgres)");
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
};
