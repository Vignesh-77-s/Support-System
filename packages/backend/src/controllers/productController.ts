import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Product from "../models/Product";

// @desc    Fetch all products
// @route   GET /api/products
// @access  Private
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({}).sort({ createdAt: -1 });
  res.json(products);
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, category, description, color } = req.body;

    const product = new Product({
      name,
      category,
      description,
      color,
      status: "Active",
    });

    const createdProduct = await Product.create(product);
    console.log(createdProduct, "---createdProduct");
    res.status(201).json(createdProduct);
  }
);

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, category, description, color, status } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name;
      product.category = category;
      product.description = description;
      product.color = color;
      product.status = status;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  }
);

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  }
);
