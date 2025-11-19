import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

// Routes
import userRoutes from "./routes/users.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import errorHandler  from "./middlewares/error.middleware.js";
import notFoundHandler  from "./middlewares/notFound.middleware.js";
import { PGConnection } from "./config/db.js";
import "./models/index.js"; // loads associations
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(helmet());

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});
app.use("/api/user", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/products", productRoutes);

await PGConnection();
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
