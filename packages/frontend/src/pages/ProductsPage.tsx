import React, { useState, useMemo, useEffect } from "react";
import { AuditLogAction, Product, ProductCategory } from "../types";
import { mockProducts } from "../data";
import { Plus, Search, ChevronDown, List, Edit, Trash2 } from "lucide-react";
import Modal from "../components/ui/Modal";
import { BRAND_COLORS, ICONS, PRODUCT_CATEGORY_COLORS } from "../constants";
import { apiService, auditLogService, useToast } from "../App";

// --- Confirmation Modal ---
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, title, children }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-600">{children}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
};

// --- Create/Edit Product Modals ---
const CreateProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (product: Omit<Product, "id" | "createdAt">) => Promise<void>;
}> = ({ isOpen, onClose, onCreate }) => {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<ProductCategory>(
    ProductCategory.Software
  );
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(BRAND_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setProductName("");
    setCategory(ProductCategory.Software);
    setDescription("");
    setColor(BRAND_COLORS[0]);
  };

  const handleSubmit = async () => {
    if (!productName.trim()) {
      alert("Product name is required");
      return;
    }

    if (description.length < 20) {
      alert("Description must be at least 20 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        name: productName.trim(),
        category,
        description: description.trim(),
        color,
        status: "Active",
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Product">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
          >
            {Object.values(ProductCategory).map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Provide a detailed description of the product (minimum 20 characters)..."
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
          ></textarea>
          <p
            className={`text-xs mt-1 text-right ${
              description.length < 20 ? "text-red-500" : "text-gray-500"
            }`}
          >
            {description.length}/500 characters (minimum 20 required)
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Color
          </label>
          <div className="flex gap-2">
            {BRAND_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full ${
                  color === c ? "ring-2 ring-offset-2 ring-neokred-primary" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
        <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            {ICONS.productIcon}
          </div>
          <div>
            <p className="font-semibold text-gray-800">
              {productName || "Product Name"}
            </p>
            <p className="text-sm text-gray-500">
              {category} • {description.substring(0, 50) || "Description"}
              {description.length > 50 ? "..." : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
        <h4 className="font-bold text-blue-800">Product Guidelines</h4>
        <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
          <li>Choose a descriptive name that clearly identifies the product</li>
          <li>Select the most appropriate category for better organization</li>
          <li>
            Provide a detailed description to help users understand the product
          </li>
          <li>Pick a brand color that represents your product visually</li>
        </ul>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting || !productName.trim() || description.length < 20
          }
          className="px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Product"}
        </button>
      </div>
    </Modal>
  );
};

const EditProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdate: (product: Product) => Promise<void>;
}> = ({ isOpen, onClose, product, onUpdate }) => {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<ProductCategory>(
    ProductCategory.Software
  );
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(BRAND_COLORS[0]);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with product data when product changes
  useEffect(() => {
    if (product) {
      setProductName(product.name);
      setCategory(product.category);
      setDescription(product.description);
      setColor(product.color);
      setStatus(product.status);
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!product) return;

    if (!productName.trim()) {
      alert("Product name is required");
      return;
    }

    if (description.length < 20) {
      alert("Description must be at least 20 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate({
        ...product,
        name: productName.trim(),
        category,
        description: description.trim(),
        color,
        status,
      });
      onClose();
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Product">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
          >
            {Object.values(ProductCategory).map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
          ></textarea>
          <p
            className={`text-xs mt-1 text-right ${
              description.length < 20 ? "text-red-500" : "text-gray-500"
            }`}
          >
            {description.length}/500 characters (minimum 20 required)
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Color
          </label>
          <div className="flex gap-2">
            {BRAND_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full ${
                  color === c ? "ring-2 ring-offset-2 ring-neokred-primary" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="md:col-span-2 flex items-center">
          <input
            id="active-product"
            type="checkbox"
            checked={status === "Active"}
            onChange={(e) =>
              setStatus(e.target.checked ? "Active" : "Inactive")
            }
            className="h-4 w-4 text-neokred-primary border-gray-300 rounded focus:ring-neokred-primary"
          />
          <label
            htmlFor="active-product"
            className="ml-2 block text-sm text-gray-900"
          >
            Product is active and available
          </label>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
        <h4 className="font-bold text-blue-800">Update Information</h4>
        <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
          <li>Changes take effect immediately</li>
          <li>Inactive products won't appear in ticket creation</li>
          <li>Existing tickets using this product remain unaffected</li>
        </ul>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting || !productName.trim() || description.length < 20
          }
          className="px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark disabled:opacity-50"
        >
          {isSubmitting ? "Updating..." : "Update Product"}
        </button>
      </div>
    </Modal>
  );
};

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Fetch products from API
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const productsData = await apiService.getProducts();
      // Ensure productsData is an array
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      toast.addToast("Failed to load products", "error");
      console.error("Error loading products:", error);
      setProducts([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (
    productData: Omit<Product, "id" | "createdAt">
  ) => {
    try {
      console.log(productData, "---productData");
      const newProduct = await apiService.createProduct(productData);
      console.log(newProduct, "---newProduct");
      setProducts((prev) => [...prev, newProduct]);
      // Audit log
      await auditLogService.logAction(
        AuditLogAction.PRODUCT_CREATE,
        `Created product: ${newProduct.name}`,
        {
          productId: newProduct.id,
          productName: newProduct.name,
          category: newProduct.category,
        }
      );
      if (newProduct) {
        toast.addToast(
          `Product "${newProduct.name}" created successfully`,
          "success"
        );
      }
    } catch (error) {
      toast.addToast("Failed to create product", "error");
      throw error;
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      const product = await apiService.updateProduct(
        updatedProduct.id,
        updatedProduct
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
      // Audit log
      await auditLogService.logAction(
        AuditLogAction.PRODUCT_UPDATE,
        `Updated product: ${product.name}`,
        {
          productId: product.id,
          changes: Object.keys(updatedProduct),
          // previousData: previousProduct,
          newData: product,
        }
      );
      toast.addToast(
        `Product "${product.name}" updated successfully`,
        "success"
      );
    } catch (error) {
      toast.addToast("Failed to update product", "error");
      throw error;
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedProduct) {
      try {
        await apiService.deleteProduct(selectedProduct.id);
        setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
        // Audit log
        await auditLogService.logAction(
          AuditLogAction.PRODUCT_DELETE,
          `Deleted product: ${selectedProduct?.name}`,
          { productId: selectedProduct?.id, productName: selectedProduct?.name }
        );
        toast.addToast(
          `Product "${selectedProduct.name}" deleted successfully.`,
          "success"
        );
      } catch (error) {
        toast.addToast("Failed to delete product", "error");
        console.error("Error deleting product:", error);
      }
    }
    setDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    return products.filter((product) => {
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateProduct}
      />
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        product={selectedProduct}
        onUpdate={handleUpdateProduct}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
      >
        Are you sure you want to delete the product "{selectedProduct?.name}"?
        This action cannot be undone.
      </ConfirmationModal>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Product Management
          </h2>
          <p className="text-sm text-gray-500">
            Manage your products and services
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark"
        >
          <Plus size={16} /> Add New Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neokred-primary/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neokred-primary/50"
          >
            <option value="All">All Categories</option>
            {Object.values(ProductCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Product
              </th>
              <th scope="col" className="px-6 py-3">
                Category
              </th>
              <th scope="col" className="px-6 py-3">
                Description
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="bg-white border-b">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: product.color }}
                    >
                      {ICONS.productIcon}
                    </div>
                    <div>
                      <p className="font-semibold">{product.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      PRODUCT_CATEGORY_COLORS[product.category]
                    }`}
                  >
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-sm truncate">
                  {product.description}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4">{product.createdAt}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="px-3 py-1 text-xs font-medium text-white bg-gray-700 rounded-md hover:bg-gray-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr className="bg-white border-b">
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  <p>No products found for the selected filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsPage;
