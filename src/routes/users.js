import express from "express";
import multer from "multer";
import {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/user.Controller.js";
import { authenticateJWT ,checkRole } from "../middlewares/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/register",  registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.get("/", authenticateJWT, getAllUsers);

router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
