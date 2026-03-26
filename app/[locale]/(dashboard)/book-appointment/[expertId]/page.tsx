'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useExpert } from '@/hooks/use-experts';
import { BookingForm } from '@/components/appointments/booking-form';

export default function BookAppointmentPage() {
  const params = useParams();
  const expertId = params.expertId as string;
  const { user, loading: authLoading } = useAuth();
  const { data: expert, isLoading: expertLoading } = useExpert(expertId);

  if (authLoading || expertLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
        <h2 className="text-xl font-semibold mb-2">Expert Not Found</h2>
        <p>The requested expert profile could not be located.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p>You must be logged in to book an appointment.</p>
      </div>
    );
  }

  const expertName = expert.users?.full_name || 'Expert';

  return (
    <div className="container py-8 max-w-4xl mx-auto">
       <BookingForm 
         expertId={expert.id} 
         userId={user.id} 
         expertName={expertName} 
       />
    </div>
  );
}
