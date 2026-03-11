import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Package, Truck, Shield, BarChart3, Users, ArrowRight, Zap, ChevronRight,
  Box, ClipboardList, ShoppingBag, Star, CheckCircle, Globe, LogIn, Download, FileSpreadsheet
} from "lucide-react";
import favicon from "../../assets/favicon.png";
import selloshipLogo from "../../assets/SELLOSHIP-landscap-white-blue.png";

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const loginMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (loginMenuRef.current && !loginMenuRef.current.contains(e.target)) {
        setShowLoginMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={favicon} alt="Selloship" className="w-9 h-9 rounded-lg" />
            <span className={`text-xl font-bold ${scrollY > 50 ? "text-gray-900" : "text-white"}`}>
              Selloship
            </span>
          </div>

          <div className={`hidden md:flex items-center gap-8 text-sm font-medium ${
            scrollY > 50 ? "text-gray-600" : "text-white/80"
          }`}>
            <a href="#features" className="hover:text-[#0a66c2] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#0a66c2] transition-colors">How It Works</a>
            <a href="#setup" className="hover:text-[#0a66c2] transition-colors">Setup Store</a>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={loginMenuRef}>
              <button
                onClick={() => setShowLoginMenu(!showLoginMenu)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  scrollY > 50 ? "text-[#0a66c2] hover:bg-[#0a66c2]/5" : "text-white hover:bg-white/10"
                }`}
              >
                <LogIn size={16} />
                Login
              </button>
              {showLoginMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2">
                    <Link
                      to="/admin/login"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors group"
                      onClick={() => setShowLoginMenu(false)}
                    >
                      <div className="w-9 h-9 bg-[#0a66c2] rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Shield size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Admin</p>
                        <p className="text-xs text-gray-500">Full system control</p>
                      </div>
                    </Link>
                    <Link
                      to="/staff/login"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors group"
                      onClick={() => setShowLoginMenu(false)}
                    >
                      <div className="w-9 h-9 bg-[#f8726a] rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Inventory Staff</p>
                        <p className="text-xs text-gray-500">Stock & orders</p>
                      </div>
                    </Link>
                    <Link
                      to="/delivery/login"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      onClick={() => setShowLoginMenu(false)}
                    >
                      <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Truck size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Delivery Staff</p>
                        <p className="text-xs text-gray-500">Deliveries & routes</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/onboarding"
              className="px-5 py-2.5 bg-[#f8726a] text-white rounded-lg text-sm font-semibold hover:bg-[#e5625a] transition-colors shadow-lg shadow-[#f8726a]/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 bg-gradient-to-br from-slate-900 via-[#0a3d73] to-[#0a66c2] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#f8726a]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#0a66c2]/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8">
            <Zap size={14} className="text-[#f8726a]" />
            <span className="text-white/80 text-sm">Smart Inventory & Order Management by Selloship</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Deliver <span className="text-[#f8726a]">5x Faster</span> with<br />
            Smart Inventory
          </h1>

          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            End-to-end inventory management with role-based dashboards for admins,
            warehouse staff, and delivery partners. Reduce RTO and scale your business.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/onboarding"
              className="px-8 py-4 bg-[#f8726a] text-white rounded-xl font-semibold hover:bg-[#e5625a] transition-all shadow-xl shadow-[#f8726a]/30 flex items-center gap-2 text-lg"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <a
              href="#setup"
              className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
            >
              Setup Your Store
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-3xl mx-auto">
            {[
              { value: "99.6%", label: "Delivery Ratio" },
              { value: "96%", label: "RTO Reduction" },
              { value: "5000+", label: "Happy Sellers" },
              { value: "18x7", label: "Support Hours" }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-white/50 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute -bottom-px left-0 right-0" style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" className="w-full" style={{ display: 'block', height: '120px' }}>
            <path d="M0,80 C360,120 720,40 1080,80 C1260,100 1380,60 1440,80 L1440,120 L0,120 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white -mt-px">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-[#0a66c2]/5 text-[#0a66c2] font-medium text-sm px-4 py-2 rounded-full mb-4">
              <Star size={14} />
              Features
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Powerful tools designed for modern e-commerce businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Box size={24} />,
                title: "Inventory Control",
                desc: "Real-time stock tracking, low-stock alerts, and automated inventory sync across all channels.",
                color: "bg-[#0a66c2]"
              },
              {
                icon: <ClipboardList size={24} />,
                title: "Order Management",
                desc: "Complete order lifecycle from NEW → PACKED → OUT FOR DELIVERY → DELIVERED with live updates.",
                color: "bg-[#f8726a]"
              },
              {
                icon: <Truck size={24} />,
                title: "Delivery Tracking",
                desc: "Assign delivery partners, track deliveries in real-time, and manage proof of delivery.",
                color: "bg-slate-800"
              },
              {
                icon: <Users size={24} />,
                title: "Role-Based Access",
                desc: "Dedicated dashboards for Admin, Inventory Staff, and Delivery Partners with proper permissions.",
                color: "bg-[#0a66c2]"
              },
              {
                icon: <BarChart3 size={24} />,
                title: "Analytics & Reports",
                desc: "Sales analytics, stock reports, delivery performance metrics, and revenue tracking.",
                color: "bg-[#f8726a]"
              },
              {
                icon: <ShoppingBag size={24} />,
                title: "Product Catalog",
                desc: "Beautiful product pages with image uploads, pricing, categories, and WhatsApp ordering.",
                color: "bg-slate-800"
              }
            ].map((feature) => (
              <div key={feature.title} className="group bg-gray-50 hover:bg-white rounded-2xl p-8 border border-gray-100 hover:border-[#0a66c2]/20 hover:shadow-xl transition-all duration-300">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-[#f8726a]/10 text-[#f8726a] font-medium text-sm px-4 py-2 rounded-full mb-4">
              <Zap size={14} />
              How It Works
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create Your Store",
                desc: "Sign up, add your store details, and set up your admin account in under 2 minutes.",
                icon: <Globe size={28} />
              },
              {
                step: "02",
                title: "Add Team & Products",
                desc: "Add your inventory staff and delivery partners. Upload products with images and pricing.",
                icon: <Users size={28} />
              },
              {
                step: "03",
                title: "Start Selling",
                desc: "Receive orders, pack inventory, assign deliveries, and track everything in real-time.",
                icon: <Truck size={28} />
              }
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="w-20 h-20 mx-auto bg-white border-2 border-[#0a66c2]/20 rounded-2xl flex items-center justify-center text-[#0a66c2] mb-6 group-hover:bg-[#0a66c2] group-hover:text-white group-hover:border-[#0a66c2] transition-all duration-300 shadow-lg">
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-[#f8726a] mb-2 block">STEP {item.step}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-[#0a3d73] to-[#0a66c2]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Scale Your Business?
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of sellers who use Selloship to manage orders, inventory, and deliveries efficiently.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/onboarding"
              className="px-8 py-4 bg-[#f8726a] text-white rounded-xl font-semibold hover:bg-[#e5625a] transition-all shadow-xl shadow-[#f8726a]/30 flex items-center gap-2 text-lg"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <a
              href="#login"
              className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
            >
              Login to Your Portal
            </a>
          </div>
        </div>
      </section>

      {/* Login Portals */}
      <section id="login" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Your Portal</h2>
            <p className="text-gray-500">Already have an account? Log in to your role-based dashboard</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "Admin Portal",
                desc: "Full system control, analytics, staff management",
                icon: <Shield size={28} />,
                link: "/admin/login",
                color: "bg-[#0a66c2]",
                shadow: "shadow-[#0a66c2]/20"
              },
              {
                title: "Staff Portal",
                desc: "Inventory management, order packing, stock tracking",
                icon: <Package size={28} />,
                link: "/staff/login",
                color: "bg-[#f8726a]",
                shadow: "shadow-[#f8726a]/20"
              },
              {
                title: "Delivery Portal",
                desc: "Delivery assignments, route tracking, POD uploads",
                icon: <Truck size={28} />,
                link: "/delivery/login",
                color: "bg-slate-800",
                shadow: "shadow-slate-500/20"
              }
            ].map((portal) => (
              <Link
                key={portal.title}
                to={portal.link}
                className={`group block p-8 rounded-2xl border border-gray-100 hover:shadow-xl ${portal.shadow} transition-all duration-300 text-center`}
              >
                <div className={`w-16 h-16 ${portal.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  {portal.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{portal.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{portal.desc}</p>
                <span className="text-[#0a66c2] text-sm font-medium flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                  Sign In <ChevronRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Store Section */}
      <section id="setup" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 font-medium text-sm px-4 py-2 rounded-full mb-4">
              <FileSpreadsheet size={14} />
              Quick Setup
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Setup Your Store</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Get started in minutes with our easy onboarding and bulk product import
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Step 1: Create Store */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-[#0a66c2] rounded-xl flex items-center justify-center text-white mb-5">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">1. Create Your Store</h3>
              <p className="text-gray-500 mb-5">Sign up, add your business details, and get your admin dashboard ready in under 2 minutes.</p>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 text-[#0a66c2] font-semibold hover:underline"
              >
                Start Onboarding <ArrowRight size={16} />
              </Link>
            </div>

            {/* Step 2: Import Products */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center text-white mb-5">
                <FileSpreadsheet size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">2. Import Products via CSV</h3>
              <p className="text-gray-500 mb-4">Bulk import your product catalog using a simple CSV file. Required columns:</p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <code className="text-sm text-gray-800 block">name, price, stock, category, unit, image</code>
                <p className="text-xs text-gray-500 mt-2">Example: "Rice Bag", 500, 100, "Groceries", "kg", "https://example.com/rice.jpg"</p>
              </div>
              <button
                onClick={() => {
                  const csv = 'name,price,stock,category,unit,image\n"Sample Product",100,50,"General","pcs","https://example.com/image.jpg"';
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'product_import_template.csv';
                  a.click();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Download size={16} />
                Download CSV Template
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={selloshipLogo} alt="Selloship" className="h-8" />
            </div>
            <div className="flex gap-8 text-sm text-white/50">
              <a href="https://selloship.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">selloship.com</a>
              <a href="#setup" className="hover:text-white transition-colors">Setup Store</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
            </div>
            <p className="text-sm text-white/30">
              © {new Date().getFullYear()} Selloship. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}