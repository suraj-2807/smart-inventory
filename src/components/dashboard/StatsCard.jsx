import React from 'react';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';

export default function StatsCards() {
  const cards = [
    {
      title: "Total Sales",
      value: "$612,917",
      subtitle: "Products vs last month",
      change: "+2.08%",
      isPositive: true,
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      icon: TrendingUp
    },
    {
      title: "Total Orders",
      value: "34,760",
      subtitle: "Orders vs last month",
      change: "+12.4%",
      isPositive: true,
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
      icon: ShoppingCart
    },
    {
      title: "Visitors",
      value: "14,987",
      subtitle: "Users vs last month",
      change: "-7.08%",
      isPositive: false,
      bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      icon: Users
    },
    {
      title: "Total Sold Products",
      value: "12,987",
      subtitle: "Products vs last month",
      change: "+12.1%",
      isPositive: true,
      bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
      icon: Package
    }
  ];

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isLargeCard = index === 0 || index === 1;
            
            return (
              <div
                key={index}
                className={`${
                  isLargeCard ? card.bgColor + ' text-white' : 'bg-white'
                } rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${
                    isLargeCard ? 'bg-white/20' : 'bg-gray-100'
                  } p-3 rounded-3xl`}>
                    <Icon className={`w-6 h-6 ${isLargeCard ? 'text-white' : 'text-gray-600'}`} strokeWidth={2} />
                  </div>
                  
                  <span className={`${
                    card.isPositive ? 'bg-green-500' : 'bg-red-500'
                  } text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                    {card.change}
                  </span>
                </div>
                
                <div>
                  <p className={`${
                    isLargeCard ? 'text-white text-opacity-90' : 'text-gray-500'
                  } text-sm font-medium mb-2`}>
                    {card.title}
                  </p>
                  
                  <h2 className={`${
                    isLargeCard ? 'text-white' : 'text-gray-900'
                  } text-4xl font-bold mb-2`}>
                    {card.value}
                  </h2>
                  
                  <p className={`${
                    isLargeCard ? 'text-white text-opacity-75' : 'text-gray-400'
                  } text-sm`}>
                    {card.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}