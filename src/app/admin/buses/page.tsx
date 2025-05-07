"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";

interface Bus {
  id: string;
  busNumber: string;
  busType: string;
  totalSeats: number;
  routeId: string;
  vendorId: string;
  isActive: boolean;
  amenities?: string[];
  trips?: {
    id: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
  }[];
  route?: {
    name: string;
  };
  vendor?: {
    name: string;
  };
}

interface Route {
  id: string;
  name: string;
  source: string;
  destination: string;
}

interface Vendor {
  id: string;
  name: string;
}

export default function BusesManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    busNumber: "",
    busType: "AC",
    totalSeats: 40,
    routeId: "",
    vendorId: "",
    isActive: true,
    amenities: ["AC", "WiFi"]
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [busToDelete, setBusToDelete] = useState<Bus | null>(null);

  // Add valid bus types constant
  const validBusTypes = ['AC', 'NON_AC', 'SLEEPER', 'SEATER', 'AC_SLEEPER', 'AC_SEATER'];

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/admin/buses");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    
    loadBuses();
    loadRoutes();
    loadVendors();
  }, [status, session, router]);

  const loadBuses = async () => {
    try {
      const response = await fetch('/api/buses');
      if (!response.ok) {
        throw new Error('Failed to fetch buses');
      }
      const data = await response.json();
      setBuses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading buses:', error);
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const response = await fetch('/api/routes');
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      });
    } else if (name === 'busType' && !validBusTypes.includes(value)) {
      // Don't update if invalid bus type
      return;
    } else if (name === 'amenities') {
      setFormData({
        ...formData,
        amenities: value.split(',').map(a => a.trim())
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (isEditing) {
        // Update existing bus
        response = await fetch('/api/buses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      } else {
        // Create new bus
        response = await fetch('/api/buses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            busNumber: formData.busNumber,
            busType: formData.busType,
            totalSeats: formData.totalSeats,
            routeId: formData.routeId,
            vendorId: formData.vendorId,
            amenities: formData.amenities
          })
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} bus`);
      }
      
      // Reset form and reload buses
      resetForm();
      loadBuses();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (bus: Bus) => {
    setFormData({
      id: bus.id,
      busNumber: bus.busNumber,
      busType: bus.busType,
      totalSeats: bus.totalSeats,
      routeId: bus.routeId,
      vendorId: bus.vendorId,
      isActive: bus.isActive,
      amenities: bus.amenities || ["AC", "WiFi"]
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      id: "",
      busNumber: "",
      busType: "AC",
      totalSeats: 40,
      routeId: "",
      vendorId: "",
      isActive: true,
      amenities: ["AC", "WiFi"]
    });
    setIsEditing(false);
    setShowForm(false);
  };

  const handleDelete = (bus: Bus) => {
    setBusToDelete(bus);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!busToDelete) return;

    try {
      const response = await fetch(`/api/buses?id=${busToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete bus');
      }

      // Remove the deleted bus from the state
      setBuses(buses.filter(bus => bus.id !== busToDelete.id));
      setShowDeleteConfirm(false);
      setBusToDelete(null);
    } catch (error) {
      console.error('Error deleting bus:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete bus');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setBusToDelete(null);
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
        <h2 className="mb-0">Buses Management</h2>
        <div className="d-flex gap-2">
          <Button onClick={() => router.push('/admin')} variant="secondary">Back to Dashboard</Button>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} variant="primary">Add New Bus</Button>
          )}
        </div>
      </div>
      {showForm && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">{isEditing ? 'Edit Bus' : 'Add New Bus'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Bus Number</label>
                  <input type="text" name="busNumber" value={formData.busNumber} onChange={handleInputChange} required placeholder="e.g. BUS-123" className="form-control" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Bus Type</label>
                  <select name="busType" value={formData.busType} onChange={handleInputChange} required className="form-select">
                    <option value="AC">AC</option>
                    <option value="NON_AC">NON_AC</option>
                    <option value="SLEEPER">Sleeper</option>
                    <option value="SEATER">Seater</option>
                    <option value="AC_SLEEPER">AC Sleeper</option>
                    <option value="AC_SEATER">AC Seater</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Total Seats</label>
                  <input type="number" name="totalSeats" value={formData.totalSeats} onChange={handleInputChange} required min="1" className="form-control" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Route</label>
                  <select name="routeId" value={formData.routeId} onChange={handleInputChange} required className="form-select">
                    <option value="">Select a route</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>{route.name} ({route.source} to {route.destination})</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Vendor</label>
                  <select name="vendorId" value={formData.vendorId} onChange={handleInputChange} required className="form-select">
                    <option value="">Select a vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Amenities</label>
                  <textarea name="amenities" value={formData.amenities.join(', ')} onChange={handleInputChange} placeholder="e.g. AC, WiFi, USB Charging" className="form-control" rows={2} />
                </div>
                {isEditing && (
                  <div className="col-12 form-check mt-2">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="form-check-input" id="isActiveCheck" />
                    <label className="form-check-label ms-2" htmlFor="isActiveCheck">Active</label>
                  </div>
                )}
              </div>
              <div className="d-flex gap-2 mt-4">
                <Button type="submit" variant="primary">{isEditing ? 'Update Bus' : 'Add Bus'}</Button>
                <Button type="button" onClick={resetForm} variant="secondary">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && busToDelete && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={cancelDelete}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete bus <b>{busToDelete.busNumber}</b>?</p>
                {busToDelete.trips && busToDelete.trips.length > 0 ? (
                  <>
                    <p className="text-danger small">This bus has {busToDelete.trips.length} associated trips that need to be handled first:</p>
                    <div className="table-responsive mb-3" style={{ maxHeight: '180px' }}>
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Departure</th>
                            <th>Arrival</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {busToDelete.trips.map((trip) => (
                            <tr key={trip.id}>
                              <td>{new Date(trip.departureTime).toLocaleString()}</td>
                              <td>{new Date(trip.arrivalTime).toLocaleString()}</td>
                              <td>{trip.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex justify-content-between">
                      <Button onClick={() => { setShowDeleteConfirm(false); router.push('/admin/trips'); }} variant="secondary">Manage Trips</Button>
                      <Button onClick={cancelDelete} variant="secondary">Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="d-flex justify-content-end gap-2">
                    <Button onClick={cancelDelete} variant="secondary">Cancel</Button>
                    <Button onClick={confirmDelete} variant="danger">Delete</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Buses Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Buses</h5>
          <span className="badge bg-primary fs-6">{buses.length} Buses</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Bus Number</th>
                <th>Type</th>
                <th>Seats</th>
                <th>Route</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">No buses found.</td>
                </tr>
              ) : (
                buses.map((bus) => (
                  <tr key={bus.id}>
                    <td className="fw-semibold"><i className="bi bi-bus-front-fill text-primary me-2"></i>{bus.busNumber}</td>
                    <td>{bus.busType}</td>
                    <td>{bus.totalSeats}</td>
                    <td>{bus.route?.name || 'N/A'}</td>
                    <td>{bus.vendor?.name || 'N/A'}</td>
                    <td>
                      <span className={`badge ${bus.isActive ? 'bg-success' : 'bg-danger'}`}>{bus.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <button onClick={() => handleEdit(bus)} className="btn btn-sm btn-outline-primary me-2">Edit</button>
                      <button onClick={() => handleDelete(bus)} className="btn btn-sm btn-outline-danger"><Trash2 className="me-1" size={16} />Delete</button>
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