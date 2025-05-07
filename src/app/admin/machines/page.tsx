"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useSession } from "next-auth/react";

interface Machine {
  id: string;
  name: string;
  location: string;
  routeId: string;
  isActive: boolean;
  route?: {
    name: string;
  };
}

interface Route {
  id: string;
  name: string;
  source: string;
  destination: string;
}

export default function MachinesManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    location: "",
    routeId: "",
    isActive: true
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/admin/machines");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    
    loadMachines();
    loadRoutes();
  }, [status, session, router]);

  const loadMachines = async () => {
    try {
      const response = await fetch('/api/machines');
      if (!response.ok) {
        throw new Error('Failed to fetch machines');
      }
      const data = await response.json();
      setMachines(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading machines:', error);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
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
        // Update existing machine
        response = await fetch('/api/machines', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      } else {
        // Create new machine
        response = await fetch('/api/machines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            location: formData.location,
            routeId: formData.routeId
          })
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} machine`);
      }
      
      // Reset form and reload machines
      resetForm();
      loadMachines();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (machine: Machine) => {
    setFormData({
      id: machine.id,
      name: machine.name,
      location: machine.location,
      routeId: machine.routeId,
      isActive: machine.isActive
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      location: "",
      routeId: "",
      isActive: true
    });
    setIsEditing(false);
    setShowForm(false);
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
        <h2 className="mb-0">Machines Management</h2>
        <div className="d-flex gap-2">
          <Button onClick={() => router.push('/admin')} variant="secondary">Back to Dashboard</Button>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} variant="primary">Add New Machine</Button>
          )}
        </div>
      </div>
      {showForm && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">{isEditing ? 'Edit Machine' : 'Add New Machine'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Self POS 1" className="form-control" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} required placeholder="e.g. Hyderabad Bus Station" className="form-control" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Route</label>
                  <select name="routeId" value={formData.routeId} onChange={handleInputChange} required className="form-select">
                    <option value="">Select a route</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>{route.name} ({route.source} to {route.destination})</option>
                    ))}
                  </select>
                </div>
                {isEditing && (
                  <div className="col-12 form-check mt-2">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="form-check-input" id="isActiveCheck" />
                    <label className="form-check-label ms-2" htmlFor="isActiveCheck">Active</label>
                  </div>
                )}
              </div>
              <div className="d-flex gap-2 mt-4">
                <Button type="submit" variant="primary">{isEditing ? 'Update Machine' : 'Add Machine'}</Button>
                <Button type="button" onClick={resetForm} variant="secondary">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Machines Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Machines</h5>
          <span className="badge bg-primary fs-6">{machines.length} Machines</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Route</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {machines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">No machines found.</td>
                </tr>
              ) : (
                machines.map((machine) => (
                  <tr key={machine.id}>
                    <td className="fw-semibold"><i className="bi bi-cpu-fill text-primary me-2"></i>{machine.name}</td>
                    <td>{machine.location}</td>
                    <td>{machine.route?.name || 'N/A'}</td>
                    <td>
                      <span className={`badge ${machine.isActive ? 'bg-success' : 'bg-danger'}`}>{machine.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <Button size="sm" variant="primary" onClick={() => handleEdit(machine)}>Edit</Button>
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