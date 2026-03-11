import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { MoreVertical, Upload, Download } from "lucide-react";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";

import AdminLayout from "../layouts/AdminLayout";
import AddProductModal from "../components/products/AddProductModal";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const storeId = getStoreId();
    let q;
    if (storeId) {
      q = query(collection(db, "products"), where("storeId", "==", storeId));
    } else {
      q = collection(db, "products");
    }
    const snapshot = await getDocs(q);
    setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
    fetchProducts();
    setShowDropdown(null);
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'Active': 'bg-green-100 text-green-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Inactive': 'bg-red-100 text-red-700',
      'On Sale': 'bg-blue-100 text-blue-700',
      'Relauncing': 'bg-purple-100 text-purple-700'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  // Export function
  const handleExport = () => {
    // Create CSV content
    const headers = ['Product Name', 'Product ID', 'Price', 'Stock', 'Type', 'Status'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        `"${p.name}"`,
        p.id.substring(0, 8).toUpperCase(),
        p.price,
        `${p.stock} ${p.unit || 'pcs'}`,
        p.category || 'General',
        p.isActive ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download CSV Template
  const handleDownloadTemplate = () => {
    const headers = 'name,price,stock,category,unit,image';
    const sample = '"Sample Product",100,50,"General","pcs","https://example.com/image.jpg"';
    const csvContent = headers + '\n' + sample;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'product_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV file
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        alert('CSV file must have a header row and at least one data row.');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple CSV parse (handles quoted values)
        const values = lines[i].match(/("[^"]*"|[^,]+)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
        if (values.length >= 3) {
          rows.push({
            name: values[headers.indexOf('name')] || values[0] || '',
            price: Number(values[headers.indexOf('price')] || values[1] || 0),
            stock: Number(values[headers.indexOf('stock')] || values[2] || 0),
            category: values[headers.indexOf('category')] || values[3] || 'General',
            unit: values[headers.indexOf('unit')] || values[4] || 'pcs',
            image: values[headers.indexOf('image')] || values[headers.indexOf('imageurl')] || values[headers.indexOf('image_url')] || values[5] || '',
          });
        }
      }
      setImportData(rows);
    };
    reader.readAsText(file);
  };

  // Upload image URL to Cloudinary
  const uploadImageUrlToCloudinary = async (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith("http")) return "";
    try {
      const formData = new FormData();
      formData.append("file", imageUrl);
      formData.append("upload_preset", "unsigned_upload");
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dchjlxn8m/image/upload",
        { method: "POST", body: formData }
      );
      const data = await res.json();
      return data.secure_url || "";
    } catch (err) {
      console.warn("Cloudinary upload failed for:", imageUrl, err);
      return "";
    }
  };

  // Bulk import products
  const handleBulkImport = async () => {
    if (importData.length === 0) return;
    setImportLoading(true);
    try {
      const storeId = getStoreId();
      for (const item of importData) {
        // Upload image URL to Cloudinary if present
        const cloudinaryUrl = item.image ? await uploadImageUrlToCloudinary(item.image) : '';
        await addDoc(collection(db, 'products'), {
          name: item.name,
          price: item.price,
          stock: item.stock,
          category: item.category,
          unit: item.unit,
          imageUrl: cloudinaryUrl,
          isActive: true,
          storeId: storeId || '',
          createdAt: serverTimestamp(),
        });
      }
      // Create notification for staff
      await addDoc(collection(db, 'notifications'), {
        type: 'product_imported',
        message: `Administrator bulk uploaded ${importData.length} products via CSV`,
        storeId: storeId || '',
        targetRole: 'all',
        createdAt: serverTimestamp(),
      });
      alert(`✅ Successfully imported ${importData.length} products!`);
      setShowImportModal(false);
      setImportData([]);
      fetchProducts();
    } catch (error) {
      alert('Error importing products: ' + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <AdminLayout title="Products">
      <div className="bg-white rounded-lg shadow dark:bg-gray-900">
        {/* Header */}
        <div className="p-6 border-b dark:border-b-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Product</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-200">
                <span>Showing</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1 bg-blue-50 text-blue-600"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Upload size={18} />
                Export
              </button>
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-green-600 border-green-300 hover:bg-green-50"
              >
                <Download size={18} />
                Import
              </button>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Add New Product
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto overflow-y-visible relative">
          <table className="w-full">
            <thead className="bg-gray-50 border-b dark:bg-gray-800 dark:border-b-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-600">
              {currentProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={product.imageUrl || `https://ui-avatars.com/api/?name=${product.name}&background=random`}
                          alt={product.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-200">
                      #{product.id.substring(0, 8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      ₹{product.price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      {product.stock} {product.unit || 'pcs'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-200">
                      {product.category || 'General'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.isActive ? 'Active' : 'Inactive')}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="relative">
                      <button
                        onClick={() => setShowDropdown(showDropdown === index ? null : index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {showDropdown === index && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowDropdown(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowModal(true);
                                  setShowDropdown(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <button 
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded ${
              currentPage === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ← Previous
          </button>
          <div className="flex items-center gap-2">
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {String(page).padStart(2, '0')}
                </button>
              )
            ))}
          </div>
          <button 
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded ${
              currentPage === totalPages 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Next →
          </button>
        </div>

        {success && (
          <div className="px-6 py-3 bg-green-50 border-t border-green-200">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}
      </div>

      {showModal && (
        <AddProductModal
          product={selectedProduct}
          onClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setSuccess("✅ Product saved successfully");
            fetchProducts();
            setTimeout(() => setSuccess(""), 3000);
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setShowImportModal(false); setImportData([]); }} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white">
                <h3 className="text-xl font-bold">Import Products from CSV</h3>
                <p className="text-sm text-white/80 mt-1">Upload a CSV file to bulk add products</p>
              </div>
              <div className="p-5 overflow-y-auto flex-1">
                {/* Template Download */}
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">CSV Format</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">Required: <code>name, price, stock</code> | Optional: <code>category, unit, image</code></p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Download size={14} /> Download Template
                  </button>
                </div>

                {/* File Upload */}
                <div className="mb-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportFile}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* Preview */}
                {importData.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preview ({importData.length} products)
                    </p>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Price</th>
                            <th className="px-3 py-2 text-left">Stock</th>
                            <th className="px-3 py-2 text-left">Category</th>
                            <th className="px-3 py-2 text-left">Unit</th>
                            <th className="px-3 py-2 text-left">Image</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                          {importData.map((row, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 dark:text-gray-200">{row.name}</td>
                              <td className="px-3 py-2 dark:text-gray-200">₹{row.price}</td>
                              <td className="px-3 py-2 dark:text-gray-200">{row.stock}</td>
                              <td className="px-3 py-2 dark:text-gray-200">{row.category}</td>
                              <td className="px-3 py-2 dark:text-gray-200">{row.unit}</td>
                              <td className="px-3 py-2">{row.image ? <img src={row.image} alt="" className="w-7 h-7 rounded object-cover" onError={(e) => { e.target.style.display='none'; }} /> : <span className="text-gray-400">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => { setShowImportModal(false); setImportData([]); }}
                  className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={importData.length === 0 || importLoading}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {importLoading ? 'Importing...' : `Import ${importData.length} Products`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}