import Category from "../models/category.js";
import { Op } from "sequelize";

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const exist = await Category.findOne({ where: { name } });
    if (exist) return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ name });

    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL CATEGORIES
export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    const whereCondition = search
      ? { name: { [Op.iLike]: `%${search}%` } }
      : {};

    const { rows, count } = await Category.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await category.update(req.body);
    res.json({ message: "Category updated", category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await category.destroy();
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
