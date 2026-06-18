import Product from "../models/Product.model.js";

export const createProduct = async (req, res, next) => {
  try {
    const { name, category, price, stock, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (price === undefined || Number(price) < 0) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    const product = await Product.create({
      name,
      category: category || "عام",
      price: Number(price),
      stock: Number(stock || 0),
      description: description || "",
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const { search } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { name, category, price, stock, description } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price: Number(price),
        stock: Number(stock),
        description,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
};