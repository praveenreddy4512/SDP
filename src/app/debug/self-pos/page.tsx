'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SelfPOSDebug() {
  const [tripId, setTripId] = useState('');
  const [seatsData, setSeatsData] = useState<any>(null);
  const [tripData, setTripData] = useState<any>(null);
  const [machineId, setMachineId] = useState('');
  const [machineData, setMachineData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeats = async () => {
    if (!tripId) {
      setError('Please enter a Trip ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSeatsData(null);

    try {
      const response = await fetch(`/api/seats?tripId=${tripId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed with status ${response.status}`);
      }
      
      console.log('Seats data:', data);
      setSeatsData(data);
    } catch (err: any) {
      console.error('Error fetching seats:', err);
      setError(err.message || 'Failed to fetch seats');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrip = async () => {
    if (!tripId) {
      setError('Please enter a Trip ID');
      return;
    }

    setLoading(true);
    setError(null);
    setTripData(null);

    try {
      const response = await fetch(`/api/trips?id=${tripId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed with status ${response.status}`);
      }
      
      console.log('Trip data:', data);
      setTripData(data);
    } catch (err: any) {
      console.error('Error fetching trip:', err);
      setError(err.message || 'Failed to fetch trip');
    } finally {
      setLoading(false);
    }
  };

  const fetchMachine = async () => {
    if (!machineId) {
      setError('Please enter a Machine ID');
      return;
    }

    setLoading(true);
    setError(null);
    setMachineData(null);

    try {
      const response = await fetch(`/api/machines?id=${machineId}&public=true`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed with status ${response.status}`);
      }
      
      console.log('Machine data:', data);
      setMachineData(data);
    } catch (err: any) {
      console.error('Error fetching machine:', err);
      setError(err.message || 'Failed to fetch machine');
    } finally {
      setLoading(false);
    }
  };

  const fetchMachineTrips = async () => {
    if (!machineId) {
      setError('Please enter a Machine ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSeatsData(null);

    try {
      const response = await fetch(`/api/machines/${machineId}/trips`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed with status ${response.status}`);
      }
      
      console.log('Machine trips:', data);
      setTripData(data);
    } catch (err: any) {
      console.error('Error fetching machine trips:', err);
      setError(err.message || 'Failed to fetch machine trips');
    } finally {
      setLoading(false);
    }
  };

  const openSelfPOS = () => {
    if (machineId) {
      window.open(`/self-pos/${machineId}`, '_blank');
    } else {
      setError('Please enter a Machine ID');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Self POS Debug Tool</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Trip Debug</h2>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip ID
              </label>
              <input
                type="text"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter trip ID"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={fetchTrip} 
                isLoading={loading}
                disabled={loading || !tripId}
              >
                Get Trip
              </Button>
              <Button 
                onClick={fetchSeats} 
                isLoading={loading}
                disabled={loading || !tripId}
              >
                Get Seats
              </Button>
            </div>
          </div>
          
          {tripData && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Trip Data</h3>
              <div className="bg-gray-50 p-3 rounded-md overflow-auto max-h-80">
                <pre className="text-xs">{JSON.stringify(tripData, null, 2)}</pre>
              </div>
            </div>
          )}
        </Card>
        
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Machine Debug</h2>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Machine ID
              </label>
              <input
                type="text"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter machine ID"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={fetchMachine} 
                isLoading={loading}
                disabled={loading || !machineId}
              >
                Get Machine
              </Button>
              <Button 
                onClick={fetchMachineTrips} 
                isLoading={loading}
                disabled={loading || !machineId}
              >
                Get Trips
              </Button>
              <Button 
                onClick={openSelfPOS} 
                disabled={!machineId}
              >
                Open Self POS
              </Button>
            </div>
          </div>
          
          {machineData && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Machine Data</h3>
              <div className="bg-gray-50 p-3 rounded-md overflow-auto max-h-80">
                <pre className="text-xs">{JSON.stringify(machineData, null, 2)}</pre>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {seatsData && (
        <Card className="p-4 mt-6">
          <h2 className="text-lg font-semibold mb-4">Seats Data</h2>
          <div className="bg-gray-50 p-3 rounded-md overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(seatsData, null, 2)}</pre>
          </div>
        </Card>
      )}
    </div>
  );
} 