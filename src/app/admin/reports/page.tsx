"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface SalesData {
  totalTickets: number;
  totalRevenue: number;
  ticketsByRoute: {
    routeName: string;
    count: number;
    revenue: number;
  }[];
  ticketsByVendor: {
    vendorName: string;
    count: number;
    revenue: number;
  }[];
  recentTickets: {
    id: string;
    passengerName: string;
    routeName: string;
    date: string;
    amount: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function ReportsAnalytics() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("week"); // "day", "week", "month", "year"
  const [currentView, setCurrentView] = useState("overview"); // "overview", "routes", "vendors", "tickets"

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/admin/reports");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    
    loadSalesData();
  }, [status, session, router, period]);

  const loadSalesData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch data from real API 
      const response = await fetch(`/api/reports/sales?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      const data = await response.json();
      setSalesData(data);
    } catch (error) {
      console.error('Error loading sales data:', error);
      setError('Failed to load sales data. Please try again later.');
      // Fallback to empty data structure
      setSalesData({
        totalTickets: 0,
        totalRevenue: 0,
        ticketsByRoute: [],
        ticketsByVendor: [],
        recentTickets: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate data for trends chart - mock data for now
  const generateTrendData = () => {
    const labels = period === 'day' ? Array.from({ length: 24 }, (_, i) => `${i}h`)
      : period === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : period === 'month' ? Array.from({ length: 30 }, (_, i) => `${i + 1}`)
      : Array.from({ length: 12 }, (_, i) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]);
    
    return labels.map((label) => ({
      name: label,
      sales: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 1000) + 200
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading sales data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/admin')}>Back to Dashboard</Button>
          </div>
        </div>
        
        <Card className="p-6 bg-red-50">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={loadSalesData}
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const renderRoutesPieChart = () => {
    if (!salesData?.ticketsByRoute.length) return <p className="text-center text-gray-500 py-10">No route data available</p>;
    
    const data = salesData.ticketsByRoute.map(item => ({
      name: item.routeName,
      value: item.count
    }));
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} tickets`, 'Tickets Sold']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderVendorsBarChart = () => {
    if (!salesData?.ticketsByVendor.length) return <p className="text-center text-gray-500 py-10">No vendor data available</p>;
    
    const data = salesData.ticketsByVendor.map(item => ({
      name: item.vendorName,
      tickets: item.count,
      revenue: item.revenue
    }));
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="tickets" fill="#8884d8" name="Tickets Sold" />
          <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue (₹)" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderSalesTrend = () => {
    const trendData = generateTrendData();
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={trendData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} name="Tickets" />
          <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (₹)" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const renderOverviewSection = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Tickets</p>
              <h2 className="text-3xl font-bold mt-1">{salesData?.totalTickets || 0}</h2>
            </div>
            <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-blue-100 mt-2">
            {period === "day" ? "Today" : 
             period === "week" ? "This Week" : 
             period === "month" ? "This Month" : "This Year"}
          </p>
        </Card>
        
        <Card className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">Total Revenue</p>
              <h2 className="text-3xl font-bold mt-1">{formatCurrency(salesData?.totalRevenue || 0)}</h2>
            </div>
            <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-green-100 mt-2">
            {period === "day" ? "Today" : 
             period === "week" ? "This Week" : 
             period === "month" ? "This Month" : "This Year"}
          </p>
        </Card>
        
        <Card className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">Average Ticket Price</p>
              <h2 className="text-3xl font-bold mt-1">
                {formatCurrency(salesData && salesData.totalTickets > 0 ? salesData.totalRevenue / salesData.totalTickets : 0)}
              </h2>
            </div>
            <div className="p-3 bg-purple-400 bg-opacity-30 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-purple-100 mt-2">Per ticket</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Sales Trend</h2>
            <div className="text-sm text-gray-500">
              {period === "day" ? "Hourly" : 
               period === "week" ? "Daily" : 
               period === "month" ? "Daily" : "Monthly"}
            </div>
          </div>
          <div className="p-4">
            {renderSalesTrend()}
          </div>
        </Card>
        
        <Card>
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Tickets by Route</h2>
          </div>
          <div className="p-4">
            {renderRoutesPieChart()}
          </div>
        </Card>
      </div>
      
      <Card className="mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Vendor Performance</h2>
        </div>
        <div className="p-4">
          {renderVendorsBarChart()}
        </div>
      </Card>
    </>
  );

  const renderRoutesSection = () => (
    <Card>
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Route Performance</h2>
      </div>
      <div className="p-4">
        {salesData?.ticketsByRoute.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No route data available for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Ticket Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData?.ticketsByRoute.map((route, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{route.routeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(route.revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(route.count > 0 ? route.revenue / route.count : 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salesData.totalTickets > 0 ? ((route.count / salesData.totalTickets) * 100).toFixed(1) + '%' : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );

  const renderVendorsSection = () => (
    <Card>
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Vendor Performance</h2>
      </div>
      <div className="p-4">
        {salesData?.ticketsByVendor.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No vendor data available for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Ticket Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData?.ticketsByVendor.map((vendor, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.vendorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(vendor.revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(vendor.count > 0 ? vendor.revenue / vendor.count : 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salesData.totalTickets > 0 ? ((vendor.count / salesData.totalTickets) * 100).toFixed(1) + '%' : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );

  const renderTicketsSection = () => (
    <Card>
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Recent Ticket Sales</h2>
      </div>
      <div className="p-4">
        {salesData?.recentTickets.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent tickets available for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passenger</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData?.recentTickets.map((ticket, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.passengerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.routeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(ticket.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(ticket.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin')} variant="secondary">Back to Dashboard</Button>
          <Button onClick={loadSalesData}>Refresh Data</Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-lg shadow-sm">
        <button 
          onClick={() => setPeriod("day")}
          className={`px-4 py-2 rounded-md transition-colors ${period === "day" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          Today
        </button>
        <button 
          onClick={() => setPeriod("week")}
          className={`px-4 py-2 rounded-md transition-colors ${period === "week" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          This Week
        </button>
        <button 
          onClick={() => setPeriod("month")}
          className={`px-4 py-2 rounded-md transition-colors ${period === "month" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          This Month
        </button>
        <button 
          onClick={() => setPeriod("year")}
          className={`px-4 py-2 rounded-md transition-colors ${period === "year" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          This Year
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-lg shadow-sm">
        <button 
          onClick={() => setCurrentView("overview")}
          className={`px-4 py-2 rounded-md transition-colors ${currentView === "overview" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setCurrentView("routes")}
          className={`px-4 py-2 rounded-md transition-colors ${currentView === "routes" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          Routes
        </button>
        <button 
          onClick={() => setCurrentView("vendors")}
          className={`px-4 py-2 rounded-md transition-colors ${currentView === "vendors" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          Vendors
        </button>
        <button 
          onClick={() => setCurrentView("tickets")}
          className={`px-4 py-2 rounded-md transition-colors ${currentView === "tickets" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          Tickets
        </button>
      </div>
      
      {currentView === "overview" && renderOverviewSection()}
      {currentView === "routes" && renderRoutesSection()}
      {currentView === "vendors" && renderVendorsSection()}
      {currentView === "tickets" && renderTicketsSection()}
    </div>
  );
} 