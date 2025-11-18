
import Category from "./category.js";
import Product from "./product.js";

// Associations here
Category.hasMany(Product, { foreignKey: "categoryId" });
Product.belongsTo(Category, { foreignKey: "categoryId" });

export { Category, Product };
