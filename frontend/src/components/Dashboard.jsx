import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, DollarSign, Package, Coffee } from 'lucide-react';
import { ordersAPI, reportsAPI } from '../api/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [todayStats, setTodayStats] = useState(null);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [todayRes, categoryRes, topRes] = await Promise.all([
        ordersAPI.getTodayStats(),
        reportsAPI.getSalesByCategory(),
        reportsAPI.getTopProducts({ limit: 5 })
      ]);

      setTodayStats(todayRes.data);
      setSalesByCategory(categoryRes.data);
      setTopProducts(topRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const statsCards = [
    {
      title: 'Today\'s Revenue',
      value: todayStats?.totalRevenue ? `$${todayStats.totalRevenue.toFixed(2)}` : '$0.00',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Today\'s Orders',
      value: todayStats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Average Order',
      value: todayStats?.totalOrders 
        ? `$${(todayStats.totalRevenue / todayStats.totalOrders).toFixed(2)}` 
        : '$0.00',
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Products',
      value: topProducts.reduce((sum, p) => sum + p.total_sold, 0),
      icon: Package,
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">{stat.title}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-2 sm:p-3 rounded-lg`}>
                <stat.icon size={20} sm:size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales by Category */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Sales by Category</h2>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_revenue"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Top Selling Products</h2>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_sold" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Recent Orders</h2>
        {todayStats?.orders && todayStats.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Order ID</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Customer</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Total</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Payment</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Time</th>
                </tr>
              </thead>
              <tbody>
                {todayStats.orders.slice(0, 5).map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">#{order.id}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{order.customer_name || 'Guest'}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 font-semibold text-green-600 text-xs sm:text-sm">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 capitalize text-xs sm:text-sm">{order.payment_method}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-500 text-xs sm:text-sm">
                      {new Date(order.order_date).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <Coffee size={40} sm:size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm sm:text-base">No orders today yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
