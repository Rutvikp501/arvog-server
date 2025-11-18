import User from "../models/user.js";
import { generateOTP } from "../utils/otpGenerator.js";
import { SendOTP } from "../utils/sendEmail.js";
import { hashPassword, comparePassword } from "../utils/encryptDecrypt.js";
import { generateToken } from "../config/jwt.config.js";

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, isAdmin } = req.body;

    const exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ message: "User already exists" });
    }


    const hashedPass = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPass,
      role,
      isAdmin,
    });

    res.status(201).json({ message: "User registered", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    user.password = undefined;

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();

    await user.update({
      otp,
      otpExpires: Date.now() + 5 * 60 * 1000,
    });

    await SendOTP(email, otp);

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashed = await hashPassword(newPassword);

    await user.update({
      password: hashed,
      otp: null,
      otpExpires: null,
    });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users?page=1&limit=10&search=demo&sortBy=id&sortOrder=DESC
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const offset = (page - 1) * limit;

    const whereCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
          ]
        }
      : {};

    const { rows, count } = await User.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      attributes: { exclude: ["password"] }
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: rows,
      pagination: {
        totalUsers: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message
    });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updateData = req.body;
    await user.update(updateData);

    res.json({ message: "User updated", user });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ message: err.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const key = user.profilePhoto?.[0]?.publicId;
    if (key) await s3Delete(key).catch(() => null);

    await user.destroy();

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
