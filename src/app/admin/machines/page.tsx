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
        <h1 className="text-2xl font-bold">Machines Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin')}>Back to Dashboard</Button>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>Add New Machine</Button>
          )}
        </div>
      </div>
      
      {showForm && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Machine' : 'Add New Machine'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                <select
                  name="routeId"
                  value={formData.routeId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a route</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.source} to {route.destination})
                    </option>
                  ))}
                </select>
              </div>
              
              {isEditing && (
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Active</label>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">{isEditing ? 'Update Machine' : 'Add Machine'}</Button>
              <Button type="button" onClick={resetForm} variant="secondary">Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {machines.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No machines found.
                </td>
              </tr>
            ) : (
              machines.map((machine) => (
                <tr key={machine.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{machine.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{machine.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {machine.route?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${machine.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {machine.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(machine)}
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