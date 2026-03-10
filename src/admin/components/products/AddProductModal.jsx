import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import { X, Upload, Check, Package, DollarSign, Hash, Image as ImageIcon } from "lucide-react";

export default function AddProductModal({
  onClose,
  onSuccess,
  product = null,
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // 👉 Prefill data when editing
  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price);
      setStock(product.stock);
    }
  }, [product]);

  const uploadImageToCloudinary = async () => {
    if (!imageFile) return product?.imageUrl || "";

    setUploading(true);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", "product_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dchjlxn8m/image/upload",
      { method: "POST", body: formData }
    );

    const data = await res.json();
    setUploading(false);
    setUploadSuccess(true);
    return data.secure_url;
  };

  const handleSubmit = async () => {
    if (!name || !price || !stock) {
      return alert("Please fill all fields");
    }

    setLoading(true);

    const imageUrl = await uploadImageToCloudinary();

    if (product) {
      // UPDATE
      await updateDoc(doc(db, "products", product.id), {
        name,
        price: Number(price),
        stock: Number(stock),
        imageUrl,
      });
    } else {
      // ADD
      const storeId = getStoreId();
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        stock: Number(stock),
        imageUrl,
        isActive: true,
        storeId: storeId || "",
        createdAt: serverTimestamp(),
      });
      // Create notification for staff
      await addDoc(collection(db, "notifications"), {
        type: "product_created",
        message: `Administrator added new product: ${name}`,
        storeId: storeId || "",
        targetRole: "all",
        createdAt: serverTimestamp(),
      });
    }

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0a66c2] p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Package size={20} />
              </div>
              <h2 className="text-2xl font-bold">
                {product ? "Edit Product" : "Add New Product"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Product Name */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Product Name *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Package size={18} />
              </div>
              <input
                className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                placeholder="Enter product name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Price and Stock Grid */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Price (₹) *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <DollarSign size={18} />
                </div>
                <input
                  className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Stock Quantity *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Hash size={18} />
                </div>
                <input
                  className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  placeholder="0"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Product Image {product ? "(Optional)" : "*"}
            </label>
            <div className="relative">
              <input
                type="file"
                id="product-image"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  setImageFile(e.target.files[0]);
                  setUploadSuccess(false);
                }}
              />
              <label
                htmlFor="product-image"
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  imageFile
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-[#0a66c2] hover:bg-gray-50"
                }`}
              >
                {imageFile ? (
                  <>
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                      <Check size={24} className="text-white" />
                    </div>
                    <p className="text-green-700 font-medium mb-1">
                      {imageFile.name}
                    </p>
                    <p className="text-sm text-green-600">
                      {(imageFile.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setImageFile(null);
                        setUploadSuccess(false);
                      }}
                      className="mt-2 text-sm text-red-600 hover:underline"
                    >
                      Remove file
                    </button>
                  </>
                ) : product?.imageUrl ? (
                  <>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <ImageIcon size={24} className="text-[#0a66c2]" />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      Current image will be kept
                    </p>
                    <p className="text-sm text-gray-500">
                      Click to upload a new image
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-gray-700 font-medium mb-1">
                      Click to upload product image
                    </p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                  </>
                )}
              </label>
            </div>

            {uploading && (
              <div className="mt-3 flex items-center gap-2 text-[#0a66c2]">
                <div className="w-4 h-4 border-2 border-[#0a66c2] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Uploading image...</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-3 flex items-center gap-2 text-green-600">
                <Check size={16} />
                <span className="text-sm font-medium">Image uploaded successfully!</span>
              </div>
            )}
          </div>

          {/* Preview Info */}
          {(name || price || stock) && (
            <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
              <div className="space-y-1 text-sm text-gray-600">
                {name && <p><span className="font-medium">Name:</span> {name}</p>}
                {price && <p><span className="font-medium">Price:</span> ₹{price}</p>}
                {stock && <p><span className="font-medium">Stock:</span> {stock} units</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="px-6 py-2.5 bg-[#0a66c2] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Check size={18} />
                {product ? "Update Product" : "Add Product"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}