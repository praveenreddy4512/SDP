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
import { Calendar, Download, Filter, RefreshCw, TrendingUp, TrendingDown, DollarSign, Ticket, Users, Percent } from "lucide-react";
import 'bootstrap/dist/css/bootstrap.min.css';

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
    const trendData = salesData && (salesData as any).trend ? (salesData as any).trend : [];
    if (!trendData.length) {
      return <p className="text-center text-muted py-4">No trend data available</p>;
    }
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
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 text-white-50">Total Tickets</h6>
                  <h2 className="card-title mb-0">{salesData?.totalTickets || 0}</h2>
                </div>
                <div className="p-3 bg-white bg-opacity-25 rounded-circle">
                  <Ticket className="text-white" size={24} />
                </div>
              </div>
              <p className="card-text small text-white-50 mt-2">
                {period === "day" ? "Today" : 
                 period === "week" ? "This Week" : 
                 period === "month" ? "This Month" : "This Year"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 text-white-50">Total Revenue</h6>
                  <h2 className="card-title mb-0">{formatCurrency(salesData?.totalRevenue || 0)}</h2>
                </div>
                <div className="p-3 bg-white bg-opacity-25 rounded-circle">
                  <DollarSign className="text-white" size={24} />
                </div>
              </div>
              <p className="card-text small text-white-50 mt-2">
                {period === "day" ? "Today" : 
                 period === "week" ? "This Week" : 
                 period === "month" ? "This Month" : "This Year"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 text-white-50">Average Ticket Price</h6>
                  <h2 className="card-title mb-0">
                    {formatCurrency(salesData && salesData.totalTickets > 0 ? salesData.totalRevenue / salesData.totalTickets : 0)}
                  </h2>
                </div>
                <div className="p-3 bg-white bg-opacity-25 rounded-circle">
                  <TrendingUp className="text-white" size={24} />
                </div>
              </div>
              <p className="card-text small text-white-50 mt-2">Per ticket</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Sales Trend</h5>
              <small className="text-muted">
                {period === "day" ? "Hourly" : 
                 period === "week" ? "Daily" : 
                 period === "month" ? "Daily" : "Monthly"}
              </small>
            </div>
            <div className="card-body">
              {renderSalesTrend()}
            </div>
          </div>
        </div>
        
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Tickets by Route</h5>
            </div>
            <div className="card-body">
              {renderRoutesPieChart()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mb-4">
        <div className="card-header bg-white">
          <h5 className="card-title mb-0">Vendor Performance</h5>
        </div>
        <div className="card-body">
          {renderVendorsBarChart()}
        </div>
      </div>
    </>
  );

  const renderRoutesSection = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Route Performance</h4>
        <span className="badge bg-primary fs-6">{salesData?.ticketsByRoute.length || 0} Routes</span>
      </div>
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {salesData?.ticketsByRoute.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">No route data available for this period</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Route</th>
                    <th>Tickets Sold</th>
                    <th>Revenue</th>
                    <th>Avg. Ticket Price</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData?.ticketsByRoute.map((route, index) => (
                    <tr key={index}>
                      <td className="fw-semibold">
                        <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                        {route.routeName}
                        {index === 0 && <span className="badge bg-success ms-2">Top Route</span>}
                      </td>
                      <td>{route.count}</td>
                      <td><span className="badge bg-info text-dark">{formatCurrency(route.revenue)}</span></td>
                      <td>{formatCurrency(route.count > 0 ? route.revenue / route.count : 0)}</td>
                      <td>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${salesData.totalTickets > 0 ? (route.count / salesData.totalTickets) * 100 : 0}%` }} aria-valuenow={route.count} aria-valuemin={0} aria-valuemax={salesData.totalTickets}></div>
                        </div>
                        <span className="small ms-2">{salesData.totalTickets > 0 ? ((route.count / salesData.totalTickets) * 100).toFixed(1) + '%' : '0%'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderVendorsSection = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Vendor Performance</h4>
        <span className="badge bg-primary fs-6">{salesData?.ticketsByVendor.length || 0} Vendors</span>
      </div>
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {salesData?.ticketsByVendor.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">No vendor data available for this period</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Vendor</th>
                    <th>Tickets Sold</th>
                    <th>Revenue</th>
                    <th>Avg. Ticket Price</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData?.ticketsByVendor.map((vendor, index) => (
                    <tr key={index}>
                      <td className="fw-semibold">
                        <i className="bi bi-person-badge-fill text-secondary me-2"></i>
                        {vendor.vendorName}
                        {index === 0 && <span className="badge bg-success ms-2">Top Vendor</span>}
                      </td>
                      <td>{vendor.count}</td>
                      <td><span className="badge bg-info text-dark">{formatCurrency(vendor.revenue)}</span></td>
                      <td>{formatCurrency(vendor.count > 0 ? vendor.revenue / vendor.count : 0)}</td>
                      <td>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-secondary" role="progressbar" style={{ width: `${salesData.totalTickets > 0 ? (vendor.count / salesData.totalTickets) * 100 : 0}%` }} aria-valuenow={vendor.count} aria-valuemin={0} aria-valuemax={salesData.totalTickets}></div>
                        </div>
                        <span className="small ms-2">{salesData.totalTickets > 0 ? ((vendor.count / salesData.totalTickets) * 100).toFixed(1) + '%' : '0%'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTicketsSection = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Recent Ticket Sales</h4>
        <span className="badge bg-primary fs-6">{salesData?.recentTickets.length || 0} Tickets</span>
      </div>
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {salesData?.recentTickets.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">No recent tickets available for this period</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Ticket ID</th>
                    <th>Passenger</th>
                    <th>Route</th>
                    <th>Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData?.recentTickets.map((ticket, index) => (
                    <tr key={index}>
                      <td className="fw-semibold">
                        <i className="bi bi-ticket-perforated-fill text-danger me-2"></i>
                        {ticket.id}
                      </td>
                      <td>{ticket.passengerName}</td>
                      <td>{ticket.routeName}</td>
                      <td>{ticket.date}</td>
                      <td><span className="badge bg-info text-dark">{formatCurrency(ticket.amount)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h1 className="h2 mb-0">Analytics Dashboard</h1>
        <div className="d-flex gap-2">
          <Button onClick={() => router.push('/admin')} variant="secondary">Back to Dashboard</Button>
          <Button onClick={loadSalesData}>Refresh Data</Button>
        </div>
      </div>
      
      <div className="d-flex flex-wrap gap-2 mb-4 bg-white p-2 rounded shadow-sm">
        <button 
          onClick={() => setPeriod("day")}
          className={`btn ${period === "day" ? "btn-primary" : "btn-light"}`}
        >
          Today
        </button>
        <button 
          onClick={() => setPeriod("week")}
          className={`btn ${period === "week" ? "btn-primary" : "btn-light"}`}
        >
          This Week
        </button>
        <button 
          onClick={() => setPeriod("month")}
          className={`btn ${period === "month" ? "btn-primary" : "btn-light"}`}
        >
          This Month
        </button>
        <button 
          onClick={() => setPeriod("year")}
          className={`btn ${period === "year" ? "btn-primary" : "btn-light"}`}
        >
          This Year
        </button>
      </div>
      
      <div className="d-flex flex-wrap gap-2 mb-4 bg-white p-2 rounded shadow-sm">
        <button 
          onClick={() => setCurrentView("overview")}
          className={`btn ${currentView === "overview" ? "btn-primary" : "btn-light"}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setCurrentView("routes")}
          className={`btn ${currentView === "routes" ? "btn-primary" : "btn-light"}`}
        >
          Routes
        </button>
        <button 
          onClick={() => setCurrentView("vendors")}
          className={`btn ${currentView === "vendors" ? "btn-primary" : "btn-light"}`}
        >
          Vendors
        </button>
        <button 
          onClick={() => setCurrentView("tickets")}
          className={`btn ${currentView === "tickets" ? "btn-primary" : "btn-light"}`}
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