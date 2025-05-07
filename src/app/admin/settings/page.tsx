"use client";

import React, { useState } from "react";

export default function AdminSettingsPage() {
  // Example state (replace with real data/fetching as needed)
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@buspos.com",
    password: "",
  });
  const [org, setOrg] = useState({
    company: "BusPOS Inc.",
    logo: "",
    contact: "123-456-7890",
  });
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);

  // Handlers (replace with real API calls)
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };
  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrg({ ...org, [e.target.name]: e.target.value });
  };
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value);
  };
  const handleNotificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(e.target.checked);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save profile to backend
    alert("Profile updated!");
  };

  const handleOrgSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save org settings to backend
    alert("Organization settings updated!");
  };

  const handlePreferencesSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save preferences to backend
    alert("Preferences updated!");
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4">Admin Settings</h1>
      <div className="row g-4">
        {/* Profile Settings */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Profile</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleProfileSave}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" name="name" value={profile.name} onChange={handleProfileChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" value={profile.email} onChange={handleProfileChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" name="password" value={profile.password} onChange={handleProfileChange} />
                </div>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </form>
            </div>
          </div>
        </div>
        {/* Organization Settings */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Organization</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleOrgSave}>
                <div className="mb-3">
                  <label className="form-label">Company Name</label>
                  <input type="text" className="form-control" name="company" value={org.company} onChange={handleOrgChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Logo URL</label>
                  <input type="text" className="form-control" name="logo" value={org.logo} onChange={handleOrgChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact</label>
                  <input type="text" className="form-control" name="contact" value={org.contact} onChange={handleOrgChange} />
                </div>
                <button type="submit" className="btn btn-info text-white">Save Organization</button>
              </form>
            </div>
          </div>
        </div>
        {/* Preferences */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">Preferences</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handlePreferencesSave}>
                <div className="mb-3">
                  <label className="form-label">Theme</label>
                  <select className="form-select" value={theme} onChange={handleThemeChange}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div className="form-check mb-3">
                  <input className="form-check-input" type="checkbox" checked={notifications} onChange={handleNotificationsChange} id="notifications" />
                  <label className="form-check-label" htmlFor="notifications">
                    Enable notifications
                  </label>
                </div>
                <button type="submit" className="btn btn-secondary">Save Preferences</button>
              </form>
            </div>
          </div>
        </div>
        {/* Add more settings sections as needed */}
      </div>
    </div>
  );
} 