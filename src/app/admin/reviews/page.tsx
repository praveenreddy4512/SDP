'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import { StarIcon } from '@heroicons/react/24/solid';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage customer reviews for trips
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
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