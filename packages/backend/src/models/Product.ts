import mongoose, { Document, Schema } from "mongoose";
import { Product as IProduct } from "../../../frontend/src/types";
import { uuid } from "uuidv4";

export interface IProductModel extends Omit<IProduct, "id">, Document {}

const productSchema: Schema<IProductModel> = new Schema(
  {
    id: { type: String, required: true, unique: true, default: uuid }, // Keep the custom ID like P002
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Software", "Hardware", "Services"],
    },
    description: { type: String, required: true },
    color: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdAt: {
      type: String,
      default: () => new Date().toLocaleDateString("en-GB"),
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete (ret as any).__v;
      },
    },
  }
);

const Product = mongoose.model<IProductModel>("Product", productSchema);

export default Product;
