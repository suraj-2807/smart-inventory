import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Package, Star, ShoppingBag, ArrowLeft, ExternalLink } from "lucide-react";

export default function DemoStore() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleBuyNow = (product) => {
    const message = `Hi! I'm interested in buying:\n\n*${product.name}*\nPrice: ₹${product.price}\n\nPlease share more details.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-[#0a66c2] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0a66c2] rounded-lg flex items-center justify-center">
                <Package className="text-white" size={18} />
              </div>
              <span className="text-lg font-bold text-gray-900">Selloship Store</span>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="px-4 py-2 bg-[#f8726a] text-white rounded-lg text-sm font-semibold hover:bg-[#e5625a] transition-colors"
          >
            Start Your Store
          </Link>
        </div>
      </header>

      {/* Store Hero */}
      <section className="bg-[#0a66c2] py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-4">
            <ShoppingBag size={14} className="text-[#f8726a]" />
            <span className="text-white/80 text-sm">Demo Store</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Browse Our Products</h1>
          <p className="text-white/60 max-w-lg mx-auto">
            Order products directly via WhatsApp — fast, simple, and secure.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-[#0a66c2] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#0a66c2] hover:text-[#0a66c2]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-56 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500">Try selecting a different category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-[#0a66c2]/20 transition-all duration-300 group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.imageUrl || "https://via.placeholder.com/300x300?text=No+Image"}
                    alt={product.name}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.stock !== undefined && product.stock <= 5 && (
                    <span className="absolute top-3 right-3 bg-[#f8726a] text-white text-xs px-2 py-1 rounded-full font-medium">
                      Low Stock
                    </span>
                  )}
                  {product.stock !== undefined && product.stock > 5 && (
                    <span className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      In Stock
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">5.0</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                    {product.name}
                  </h3>
                  {product.category && (
                    <p className="text-xs text-gray-400 mb-2">{product.category}</p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                  </div>
                  <button
                    onClick={() => handleBuyNow(product)}
                    className="w-full py-2.5 bg-[#0a66c2] text-white rounded-lg font-medium hover:bg-[#084d94] transition-colors text-sm"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0a66c2] rounded-lg flex items-center justify-center">
              <Package className="text-white" size={14} />
            </div>
            <span className="font-bold">Selloship</span>
          </div>
          <p className="text-sm text-white/40">
            Powered by <a href="https://selloship.com" target="_blank" rel="noopener noreferrer" className="text-[#0a66c2] hover:underline">selloship.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
