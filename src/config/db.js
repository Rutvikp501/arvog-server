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
    dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // set true if you provide CA
    }
  }
  },
  
);

export default sequelize;


export const PGConnection = async () => {
  try {
    
    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully.");

    await sequelize.sync({ alter: true }); 
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
