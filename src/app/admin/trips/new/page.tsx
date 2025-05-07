"use client";

import React, { useState } from "react";

// TODO: Replace with real data from your backend
const mockRoutes = [
  { id: "route1", name: "Delhi to Mumbai" },
  { id: "route2", name: "Chennai to Bangalore" },
];
const mockBuses = [
  { id: "bus1", busNumber: "BUS001", type: "AC" },
  { id: "bus2", busNumber: "BUS002", type: "NON-AC" },
];

export default function CreateTripPage() {
  const [form, setForm] = useState({
    routeId: "",
    busId: "",
    departureTime: "",
    arrivalTime: "",
    availableSeats: "",
    price: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send form data to backend API
    alert("Trip created!\n" + JSON.stringify(form, null, 2));
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4">Create New Trip</h1>
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Trip Details</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Route</label>
                  <select
                    className="form-select"
                    name="routeId"
                    value={form.routeId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a route</option>
                    {mockRoutes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Bus</label>
                  <select
                    className="form-select"
                    name="busId"
                    value={form.busId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a bus</option>
                    {mockBuses.map(bus => (
                      <option key={bus.id} value={bus.id}>
                        {bus.busNumber} ({bus.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Departure Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="departureTime"
                    value={form.departureTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Arrival Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="arrivalTime"
                    value={form.arrivalTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Available Seats</label>
                  <input
                    type="number"
                    className="form-control"
                    name="availableSeats"
                    value={form.availableSeats}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Ticket Price (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Create Trip
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 