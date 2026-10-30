import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, BarChart3, Download } from 'lucide-react';
import { reportsAPI } from '../api/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Reports({ readOnly = false }) {
  const [dailyReport, setDailyReport] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [profitAnalysis, setProfitAnalysis] = useState([]);
  const [yearlyReport, setYearlyReport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewType, setViewType] = useState('daily'); // 'daily', 'monthly', 'yearly'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [selectedDate, selectedMonth, selectedYear, viewType]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const yearForChart = viewType === 'yearly' ? selectedYear : new Date().getFullYear();
      const [monthlyRes, profitRes] = await Promise.all([
        reportsAPI.getMonthlyRevenue(yearForChart),
        reportsAPI.getProfitAnalysis()
      ]);

      setMonthlyRevenue(monthlyRes.data);
      setProfitAnalysis(profitRes.data);

      if (viewType === 'daily') {
        const dailyRes = await reportsAPI.getDaily(selectedDate);
        setDailyReport(dailyRes.data);
      } else if (viewType === 'monthly') {
        const monthlyDetailRes = await reportsAPI.getMonthly(selectedMonth);
        setDailyReport(monthlyDetailRes.data);
      } else if (viewType === 'yearly') {
        const yearlyRes = await reportsAPI.getYearly(selectedYear);
        setYearlyReport(yearlyRes.data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    let reportText = '';
    let filename = '';
    const reportData = viewType === 'yearly' ? yearlyReport : dailyReport;
    const dateLabel = viewType === 'daily' ? selectedDate : viewType === 'monthly' ? selectedMonth : selectedYear;
    const viewLabel = viewType.charAt(0).toUpperCase() + viewType.slice(1);

    reportText = `
╔══════════════════════════════════════════════════════════════╗
║                    CAFE POS SYSTEM                          ║
║                  ${viewLabel} SALES REPORT                         ║
╚══════════════════════════════════════════════════════════════╝

${'='.repeat(60)}
Report Period: ${dateLabel}
Generated: ${new Date().toLocaleString()}
${'='.repeat(60)}

╔══════════════════════════════════════════════════════════════╗
║                      SUMMARY                                 ║
╚══════════════════════════════════════════════════════════════╝

  Total Revenue:    $${(reportData?.totalRevenue || 0).toFixed(2).padStart(12)}
  Total Cost:       $${(reportData?.totalCost || 0).toFixed(2).padStart(12)}
  ──────────────────────────────────────────────
  Net Profit:       $${(reportData?.profit || 0).toFixed(2).padStart(12)}
  Total Orders:     ${(reportData?.totalOrders || 0).toString().padStart(12)}

╔══════════════════════════════════════════════════════════════╗
║              TOP 10 PRODUCTS BY PROFIT                       ║
╚══════════════════════════════════════════════════════════════╝

${profitAnalysis.slice(0, 10).map((p, i) => `
  ${String(i + 1).padStart(2)}. ${p.name.padEnd(20)}
      Revenue: $${p.total_revenue.toFixed(2).padStart(10)}
      Cost:    $${p.total_cost.toFixed(2).padStart(10)}
      Profit:  $${p.profit.toFixed(2).padStart(10)} (${p.profit_margin}%)
`).join('')}

╔══════════════════════════════════════════════════════════════╗
║              COMPLETE PROFIT ANALYSIS                         ║
╚══════════════════════════════════════════════════════════════╝

${'─'.repeat(80)}
  Product               Category        Sold      Revenue       Cost       Profit    Margin
${'─'.repeat(80)}
${profitAnalysis.map((item) => {
  const name = item.name.substring(0, 20).padEnd(20);
  const category = item.category.substring(0, 12).padEnd(12);
  const sold = item.total_sold.toString().padEnd(8);
  const revenue = `$${item.total_revenue.toFixed(2)}`.padStart(10);
  const cost = `$${item.total_cost.toFixed(2)}`.padStart(10);
  const profit = `$${item.profit.toFixed(2)}`.padStart(10);
  const margin = `${item.profit_margin}%`.padStart(8);
  return `  ${name} ${category} ${sold} ${revenue} ${cost} ${profit} ${margin}`;
}).join('\n')}
${'─'.repeat(80)}

╔══════════════════════════════════════════════════════════════╗
║                        END OF REPORT                          ║
╚══════════════════════════════════════════════════════════════╝
`;

    filename = `${viewType.toLowerCase()}-report-${dateLabel}.txt`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm sm:text-base capitalize">
            {viewType} View - {viewType === 'daily' ? selectedDate : viewType === 'monthly' ? selectedMonth : selectedYear}
          </p>
        </div>
        <button
          onClick={handleExportReport}
          disabled={readOnly}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
            readOnly
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
          title={`Export ${viewType} report`}
        >
          <Download size={16} sm:size={20} />
          <span className="hidden sm:inline">Export {viewType.charAt(0).toUpperCase() + viewType.slice(1)} Report</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* View and Date Selector */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* View Type Selector */}
          <div className="flex items-center gap-2">
            <label className="text-gray-600 font-medium text-sm sm:text-base">View:</label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Date/Month/Year Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500" size={18} sm:size={20} />
            <label className="text-gray-600 font-medium text-sm sm:text-base">
              {viewType === 'daily' ? 'Select Date:' : viewType === 'monthly' ? 'Select Month:' : 'Select Year:'}
            </label>
            {viewType === 'daily' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base w-full sm:w-auto"
              />
            )}
            {viewType === 'monthly' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base w-full sm:w-auto"
              />
            )}
            {viewType === 'yearly' && (
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                min="2020"
                max="2030"
                className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base w-full sm:w-auto"
              />
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs sm:text-sm">Total Revenue</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">
            ${(viewType === 'yearly' ? yearlyReport : dailyReport)?.totalRevenue?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs sm:text-sm">Total Cost</p>
          <p className="text-lg sm:text-2xl font-bold text-red-600 mt-1">
            ${(viewType === 'yearly' ? yearlyReport : dailyReport)?.totalCost?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs sm:text-sm">Profit</p>
          <p className={`text-lg sm:text-2xl font-bold mt-1 ${((viewType === 'yearly' ? yearlyReport : dailyReport)?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${(viewType === 'yearly' ? yearlyReport : dailyReport)?.profit?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-xs sm:text-sm">Total Orders</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-1">
            {(viewType === 'yearly' ? yearlyReport : dailyReport)?.totalOrders || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp size={20} sm:size={24} />
            {viewType === 'yearly' ? 'Monthly Revenue Trend' : 'Monthly Revenue Trend (Current Year)'}
          </h2>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Analysis */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart3 size={20} sm:size={24} />
            Profit by Product
          </h2>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitAnalysis.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="profit" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Profit Analysis Table */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Profit Analysis (Decision Support)</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Product</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Category</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Sold</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Revenue</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Cost</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Profit</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-600 font-medium text-xs sm:text-sm">Margin</th>
              </tr>
            </thead>
            <tbody>
              {profitAnalysis.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">{item.name}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm">{item.category}</span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{item.total_sold}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-green-600 text-xs sm:text-sm">${item.total_revenue.toFixed(2)}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-red-600 text-xs sm:text-sm">${item.total_cost.toFixed(2)}</td>
                  <td className={`py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${item.profit.toFixed(2)}
                  </td>
                  <td className={`py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm ${item.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.profit_margin}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MIS Assignment Context */}
      <div className="bg-amber-50 border border-amber-200 p-4 sm:p-6 rounded-xl">
        <h3 className="font-bold text-amber-800 mb-2 text-sm sm:text-base">MIS Assignment Context</h3>
        <ul className="text-amber-700 space-y-1 text-xs sm:text-sm">
          <li>• <strong>TPS (Transaction Processing System):</strong> Real-time order processing and inventory updates</li>
          <li>• <strong>MIS (Management Information System):</strong> Daily reports, sales analytics, and inventory tracking</li>
          <li>• <strong>DSS (Decision Support System):</strong> Profit analysis helps identify which products to invest in</li>
          <li>• <strong>Data Visualization:</strong> Charts and graphs for trend analysis and decision making</li>
        </ul>
      </div>
    </div>
  );
}
