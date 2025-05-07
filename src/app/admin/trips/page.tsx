"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Calendar, Clock, Bus, MapPin, Users, AlertTriangle, DollarSign, TrendingUp, XCircle, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";

interface Trip {
  id: string;
  bus: {
    busNumber: string;
    route: {
      name: string;
      source: string;
      destination: string;
    };
  };
  departureTime: string;
  arrivalTime: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  availableSeats: number;
  totalSeats: number;
  metrics?: {
    totalPassengers: number;
    totalRevenue: number;
    occupancyRate: number;
    cancelledTickets: number;
    refundedTickets: number;
    isOnTime: boolean;
    averageTicketPrice: number;
  };
}

export default function TripsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [historicalTrips, setHistoricalTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/admin/trips");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    
    loadTrips();
  }, [status, session, router]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/trips");
      if (!response.ok) {
        throw new Error("Failed to fetch trips");
      }
      const data = await response.json();
      const now = new Date();
      
      // Split trips into upcoming and historical
      const upcoming = data.filter((trip: Trip) => new Date(trip.departureTime) > now);
      const historical = data.filter((trip: Trip) => new Date(trip.departureTime) <= now);
      
      setUpcomingTrips(upcoming);
      setHistoricalTrips(historical);
    } catch (error) {
      console.error("Error loading trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Calendar className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "COMPLETED":
        return <Bus className="h-4 w-4" />;
      case "CANCELLED":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bus className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Trips Management</h2>
        <Button onClick={() => router.push('/admin/trips/new')} variant="primary">Create New Trip</Button>
      </div>
      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'upcoming' ? ' active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Trips
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'history' ? ' active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Trip History
          </button>
        </li>
      </ul>
      {/* Trips Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{activeTab === 'upcoming' ? 'Upcoming Trips' : 'Trip History'}</h5>
          <span className="badge bg-primary fs-6">{(activeTab === 'upcoming' ? upcomingTrips.length : historicalTrips.length)} Trips</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Bus & Route</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Seats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'upcoming' ? upcomingTrips : historicalTrips).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">No trips found.</td>
                </tr>
              ) : (
                (activeTab === 'upcoming' ? upcomingTrips : historicalTrips).map((trip) => (
                  <tr key={trip.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <Bus className="me-2 text-secondary" size={28} />
                        <div>
                          <div className="fw-semibold">Bus {trip.bus.busNumber}</div>
                          <div className="text-muted small">{trip.bus.route.name}</div>
                          <div className="text-muted small"><i className="bi bi-geo-alt-fill me-1"></i>{trip.bus.route.source} → {trip.bus.route.destination}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="mb-1"><i className="bi bi-calendar-event me-1"></i>{format(new Date(trip.departureTime), 'dd MMM yyyy, h:mm a')}</div>
                      <div className="text-muted small"><i className="bi bi-clock me-1"></i>Arrives: {format(new Date(trip.arrivalTime), 'dd MMM, h:mm a')}</div>
                    </td>
                    <td>
                      <span className={`badge ${trip.status === 'SCHEDULED' ? 'bg-primary' : trip.status === 'IN_PROGRESS' ? 'bg-success' : trip.status === 'COMPLETED' ? 'bg-secondary' : 'bg-danger'}`}>{trip.status.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span className="badge bg-info text-dark">{trip.availableSeats} / {trip.totalSeats}</span>
                    </td>
                    <td>
                      <Button size="sm" variant="primary" onClick={() => router.push(`/admin/trips/${trip.id}`)}>View</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 