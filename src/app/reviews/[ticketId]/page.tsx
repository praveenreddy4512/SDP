'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { StarIcon } from '@heroicons/react/24/solid';

export default function ReviewPage() {
  const { ticketId } = useParams();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
          rating,
          review,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-green-600 mb-4">
            Thank You for Your Review!
          </h2>
          <p className="text-center text-gray-600">
            Your feedback has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Rate Your Experience</h2>
        <p className="text-center text-gray-600 mb-6">
          Ticket ID: {ticketId}
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <StarIcon
                  className={`h-8 w-8 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="review" className="block text-sm font-medium text-gray-700">
              Additional Comments
            </label>
            <textarea
              id="review"
              rows={4}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Share your experience..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              rating === 0 || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
} 