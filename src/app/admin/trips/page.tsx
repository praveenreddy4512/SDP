"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useSession } from "next-auth/react";

interface Trip {
  id: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
  busId: string;
  bus?: {
    busNumber: string;
    busType: string;
  };
  route?: {
    name: string;
    source: string;
    destination: string;
  };
}

interface Bus {
  id: string;
  busNumber: string;
  busType: string;
  routeId: string;
  route?: {
    name: string;
    source: string;
    destination: string;
  };
}

export default function TripsManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    departureTime: "",
    arrivalTime: "",
    status: "SCHEDULED",
    busId: ""
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/admin/trips");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    
    loadTrips();
    loadBuses();
  }, [status, session, router]);

  const loadTrips = async () => {
    try {
      const response = await fetch('/api/trips');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      setTrips(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading trips:', error);
      setLoading(false);
    }
  };

  const loadBuses = async () => {
    try {
      const response = await fetch('/api/buses');
      if (!response.ok) {
        throw new Error('Failed to fetch buses');
      }
      const data = await response.json();
      setBuses(data);
    } catch (error) {
      console.error('Error loading buses:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (isEditing) {
        // Update existing trip
        response = await fetch('/api/trips', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      } else {
        // Create new trip
        response = await fetch('/api/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            departureTime: formData.departureTime,
            arrivalTime: formData.arrivalTime,
            status: formData.status,
            busId: formData.busId
          })
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} trip`);
      }
      
      // Reset form and reload trips
      resetForm();
      loadTrips();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (trip: Trip) => {
    setFormData({
      id: trip.id,
      departureTime: formatDateTimeForInput(trip.departureTime),
      arrivalTime: formatDateTimeForInput(trip.arrivalTime),
      status: trip.status,
      busId: trip.busId
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      id: "",
      departureTime: "",
      arrivalTime: "",
      status: "SCHEDULED",
      busId: ""
    });
    setIsEditing(false);
    setShowForm(false);
  };

  // Helper function to format date-time for input
  const formatDateTimeForInput = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toISOString().slice(0, 16);
  };

  // Helper function to format date-time for display
  const formatDateTimeForDisplay = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trips Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin')}>Back to Dashboard</Button>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>Schedule New Trip</Button>
          )}
        </div>
      </div>
      
      {showForm && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Trip' : 'Schedule New Trip'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bus</label>
                <select
                  name="busId"
                  value={formData.busId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a bus</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.id}>
                      {bus.busNumber} - {bus.busType} - {bus.route?.source} to {bus.route?.destination}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                <input
                  type="datetime-local"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                <input
                  type="datetime-local"
                  name="arrivalTime"
                  value={formData.arrivalTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">{isEditing ? 'Update Trip' : 'Schedule Trip'}</Button>
              <Button type="button" onClick={resetForm} variant="secondary">Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrival</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trips.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No trips found.
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {trip.route?.name || `${trip.route?.source} to ${trip.route?.destination}` || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trip.bus?.busNumber} ({trip.bus?.busType})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTimeForDisplay(trip.departureTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTimeForDisplay(trip.arrivalTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${trip.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : 
                        trip.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 
                        trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`}
                    >
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(trip)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 