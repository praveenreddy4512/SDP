"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import { formatCurrency } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface Route {
  id: string;
  name: string;
  source: string;
  destination: string;
  basePrice: number;
  distance: number;
  buses: { id: string; busNumber: string }[];
  machines: { id: string; name: string; location: string }[];
}

export default function RoutesManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    source: "",
    destination: "",
    basePrice: 0,
    distance: 0
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/admin/routes");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    
    loadRoutes();
  }, [status, session, router]);

  const loadRoutes = async () => {
    try {
      const response = await fetch('/api/routes');
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      const data = await response.json();
      setRoutes(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading routes:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      const numValue = value === '' ? 0 : parseFloat(value);
      setFormData({
        ...formData,
        [name]: isNaN(numValue) ? 0 : numValue
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
        // Update existing route
        response = await fetch('/api/routes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      } else {
        // Create new route
        response = await fetch('/api/routes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            source: formData.source,
            destination: formData.destination,
            basePrice: formData.basePrice,
            distance: formData.distance
          })
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} route`);
      }
      
      // Reset form and reload routes
      resetForm();
      loadRoutes();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (route: Route) => {
    setFormData({
      id: route.id,
      name: route.name,
      source: route.source,
      destination: route.destination,
      basePrice: route.basePrice,
      distance: route.distance
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      source: "",
      destination: "",
      basePrice: 0,
      distance: 0
    });
    setIsEditing(false);
    setShowForm(false);
  };

  const handleDelete = async (route: Route) => {
    setRouteToDelete(route);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!routeToDelete) return;

    try {
      const response = await fetch(`/api/routes?id=${routeToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete route');
      }

      // Remove the deleted route from the state
      setRoutes(routes.filter(route => route.id !== routeToDelete.id));
      setShowDeleteConfirm(false);
      setRouteToDelete(null);
    } catch (error) {
      console.error('Error deleting route:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete route');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setRouteToDelete(null);
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
        <h2 className="mb-0">Routes Management</h2>
        <div className="d-flex gap-2">
          <Button onClick={() => router.push('/admin')} variant="secondary">Back to Dashboard</Button>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} variant="primary">Add New Route</Button>
          )}
        </div>
      </div>
      {showForm && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">{isEditing ? 'Edit Route' : 'Add New Route'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Route Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Hyderabad to Bangalore" className="form-control" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Source</label>
                  <input type="text" name="source" value={formData.source} onChange={handleInputChange} required placeholder="e.g. Hyderabad" className="form-control" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Destination</label>
                  <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} required placeholder="e.g. Bangalore" className="form-control" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Base Price</label>
                  <input type="number" name="basePrice" value={formData.basePrice} onChange={handleInputChange} required min="0" className="form-control" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Distance (km)</label>
                  <input type="number" name="distance" value={formData.distance} onChange={handleInputChange} required min="0" className="form-control" />
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <Button type="submit" variant="primary">{isEditing ? 'Update Route' : 'Add Route'}</Button>
                <Button type="button" onClick={resetForm} variant="secondary">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && routeToDelete && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={cancelDelete}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete route <b>{routeToDelete.name}</b>?</p>
                <div className="d-flex justify-content-end gap-2">
                  <Button onClick={cancelDelete} variant="secondary">Cancel</Button>
                  <Button onClick={confirmDelete} variant="danger">Delete</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Routes Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Routes</h5>
          <span className="badge bg-primary fs-6">{routes.length} Routes</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Route Name</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Base Price</th>
                <th>Distance (km)</th>
                <th>Buses</th>
                <th>Machines</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted">No routes found.</td>
                </tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id}>
                    <td className="fw-semibold"><i className="bi bi-signpost-2-fill text-primary me-2"></i>{route.name}</td>
                    <td>{route.source}</td>
                    <td>{route.destination}</td>
                    <td><span className="badge bg-info text-dark">{formatCurrency(route.basePrice)}</span></td>
                    <td>{route.distance}</td>
                    <td>
                      <span className="badge bg-secondary">{route.buses.length}</span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{route.machines.length}</span>
                    </td>
                    <td>
                      <button onClick={() => handleEdit(route)} className="btn btn-sm btn-outline-primary me-2">Edit</button>
                      <button onClick={() => handleDelete(route)} className="btn btn-sm btn-outline-danger"><Trash2 className="me-1" size={16} />Delete</button>
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