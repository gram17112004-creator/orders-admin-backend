import Product from "../models/Product.model.js";

export const createProduct = async (req, res, next) => {
  try {
    const { name, category, price, stock, imageUrl, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (price === undefined || Number(price) < 0) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    const product = await Product.create({
      name: name.trim(),
      category: category?.trim() || "عام",
      price: Number(price),
      stock: Number(stock || 0),
      imageUrl: imageUrl?.trim() || "",
      description: description?.trim() || "",
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(filter)
      .select("name category price stock imageUrl description createdAt")
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      total,
      page: pageNumber,
      limit: limitNumber,
      results: products.length,
      products,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { name, category, price, stock, imageUrl, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (price === undefined || Number(price) < 0) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    if (stock === undefined || Number(stock) < 0) {
      return res.status(400).json({ message: "Valid stock is required" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        category: category?.trim() || "عام",
        price: Number(price),
        stock: Number(stock),
        imageUrl: imageUrl?.trim() || "",
        description: description?.trim() || "",
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