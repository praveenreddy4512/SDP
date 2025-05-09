'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import { StarIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface Review {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
  ticket: {
    id: string;
    passengerName: string;
    trip: {
      bus: {
        busNumber: string;
        route: {
          source: string;
          destination: string;
        };
      };
    };
  };
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [form, setForm] = useState({
    rating: 5,
    review: '',
    passengerName: '',
    busNumber: '',
    source: '',
    destination: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/admin/reviews');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchReviews();
    }
  }, [status, session, router]);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRatingChange = (rating: number) => {
    setForm({ ...form, rating });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setShowThankYou(true);
      setSubmitting(false);
      setForm({ rating: 5, review: '', passengerName: '', busNumber: '', source: '', destination: '' });
      fetchReviews();
      setTimeout(() => setShowThankYou(false), 3000);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <StarIcon className="h-8 w-8 text-yellow-400" />
          <h1 className="text-3xl font-extrabold text-gray-900">Customer Reviews</h1>
        </div>
        <p className="mb-6 text-md text-gray-700">
          View, manage, and add customer reviews for trips
        </p>

        {/* Review Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Add a Review</h2>
          <div className="flex items-center mb-4">
            <span className="mr-2 text-gray-600">Rating:</span>
            {[...Array(5)].map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => handleRatingChange(i + 1)}
                className="focus:outline-none"
              >
                <StarIcon
                  className={`h-6 w-6 ${i < form.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              </button>
            ))}
          </div>
          <div className="mb-3">
            <input
              type="text"
              name="passengerName"
              value={form.passengerName}
              onChange={handleFormChange}
              placeholder="Passenger Name"
              className="w-full border rounded px-3 py-2 mb-2"
              required
            />
            <input
              type="text"
              name="busNumber"
              value={form.busNumber}
              onChange={handleFormChange}
              placeholder="Bus Number"
              className="w-full border rounded px-3 py-2 mb-2"
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                name="source"
                value={form.source}
                onChange={handleFormChange}
                placeholder="Source"
                className="w-1/2 border rounded px-3 py-2 mb-2"
                required
              />
              <input
                type="text"
                name="destination"
                value={form.destination}
                onChange={handleFormChange}
                placeholder="Destination"
                className="w-1/2 border rounded px-3 py-2 mb-2"
                required
              />
            </div>
            <textarea
              name="review"
              value={form.review}
              onChange={handleFormChange}
              placeholder="Write your review..."
              className="w-full border rounded px-3 py-2"
              rows={3}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded shadow"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
          {showThankYou && (
            <div className="flex items-center mt-4 text-green-700 bg-green-100 rounded p-3 animate-fade-in">
              <CheckCircleIcon className="h-6 w-6 mr-2 text-green-500" />
              Thank you for your review!
            </div>
          )}
        </form>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6 hover:shadow-lg transition-shadow border border-gray-100 bg-white rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-5 w-5 ${
                            i < review.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {review.ticket.passengerName}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {review.ticket.trip.bus.route.source} to{' '}
                    {review.ticket.trip.bus.route.destination} - Bus{' '}
                    {review.ticket.trip.bus.busNumber}
                  </p>
                  {review.review && (
                    <p className="mt-2 text-gray-700">{review.review}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {reviews.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No reviews found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 