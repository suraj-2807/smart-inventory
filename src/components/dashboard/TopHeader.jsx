import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function TopHeader() {
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex items-center justify-between py-4">
      
      {/* Left - Title and Date */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
        <p className="text-sm text-gray-500 mt-1">
          {getCurrentDate()}
        </p>
      </div>

      {/* Right - Icons and Profile */}
      <div className="flex items-center gap-6">
        {/* Search Icon */}
        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          <Search className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* Notification Icon */}
        <button className="text-gray-500 hover:text-gray-700 transition-colors relative">
          <Bell className="w-5 h-5" strokeWidth={2} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Section */}
        <div className="flex items-center gap-3">
          <img 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="text-sm">
            <p className="font-semibold text-gray-900">Ferra Alexandra</p>
            <p className="text-gray-500 text-xs">Admin story</p>
          </div>
        </div>
      </div>
    </div>
  );
}