import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Search } from 'lucide-react';
import { inventoryAPI } from '../api/api';

export default function Inventory({ readOnly = false }) {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const [invRes, lowRes] = await Promise.all([
        inventoryAPI.getAll(),
        inventoryAPI.getLowStock(10)
      ]);

      setInventory(invRes.data);
      setLowStock(lowRes.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async (productId, quantity) => {
    try {
      await inventoryAPI.restock({ product_id: productId, quantity });
      loadInventory();
      alert('Inventory restocked successfully!');
    } catch (error) {
      console.error('Error restocking:', error);
      alert('Failed to restock');
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockLevel = (quantity) => {
    if (quantity <= 10) return { color: 'bg-red-500', text: 'Low' };
    if (quantity <= 25) return { color: 'bg-yellow-500', text: 'Medium' };
    return { color: 'bg-green-500', text: 'Good' };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Inventory Management</h1>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle size={20} sm:size={24} />
            <span className="font-bold text-sm sm:text-base">Low Stock Alert</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(item => (
              <span key={item.id} className="bg-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm text-red-700 border border-red-200">
                {item.name}: {item.quantity} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} sm:size={20} />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 sm:py-4 px-3 sm:px-6 text-gray-600 font-medium text-xs sm:text-sm">Product</th>
                <th className="text-left py-2 sm:py-4 px-3 sm:px-6 text-gray-600 font-medium text-xs sm:text-sm">Category</th>
                <th className="text-left py-2 sm:py-4 px-3 sm:px-6 text-gray-600 font-medium text-xs sm:text-sm">Stock Level</th>
                <th className="text-left py-2 sm:py-4 px-3 sm:px-6 text-gray-600 font-medium text-xs sm:text-sm">Quantity</th>
                <th className="text-left py-2 sm:py-4 px-3 sm:px-6 text-gray-600 font-medium text-xs sm:text-sm">Price</th>
                <th className="text-left py-2 sm:py-4 px-3 sm:px-6 text-gray-600 font-medium text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => {
                const stockLevel = getStockLevel(item.quantity);
                return (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-amber-100 p-1.5 sm:p-2 rounded-lg">
                          <Package className="text-amber-600" size={16} sm:size={20} />
                        </div>
                        <span className="font-medium text-gray-800 text-xs sm:text-sm">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-4 px-3 sm:px-6">
                      <span className="bg-gray-100 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm text-gray-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${stockLevel.color}`} />
                        <span className="text-gray-700 text-xs sm:text-sm">{stockLevel.text}</span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-4 px-3 sm:px-6 font-semibold text-gray-800 text-xs sm:text-sm">{item.quantity}</td>
                    <td className="py-2 sm:py-4 px-3 sm:px-6 font-semibold text-green-600 text-xs sm:text-sm">${item.price.toFixed(2)}</td>
                    <td className="py-2 sm:py-4 px-3 sm:px-6">
                      <button
                        onClick={() => handleRestock(item.product_id, 10)}
                        disabled={readOnly}
                        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                          readOnly
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        <Plus size={14} sm:size={16} />
                        <span className="hidden sm:inline">Add 10</span>
                        <span className="sm:hidden">+10</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs sm:text-sm">Total Products</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{inventory.length}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs sm:text-sm">Low Stock Items</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{lowStock.length}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs sm:text-sm">Total Stock Value</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
            ${inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
