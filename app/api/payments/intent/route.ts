import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypass RLS for server operations)
// Ensure these env vars are in .env.local: 
// NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, amount } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    // 1. Verify appointment exists and is unpaid
    const { data: appointment, error: fetchErr } = await supabaseAdmin
      .from('appointments')
      .select('payment_status, expert_base_price')
      .eq('id', appointmentId)
      .single();

    if (fetchErr || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.payment_status === 'paid') {
      return NextResponse.json({ error: 'Appointment already paid' }, { status: 400 });
    }

    // 2. Here you would normally call Stripe/PayPal API:
    // const paymentIntent = await stripe.paymentIntents.create({ amount, currency: 'usd' });
    
    // For this mock implementation, we just generate a fake transaction info
    const mockPaymentId = `pi_mock_${Math.random().toString(36).substring(2, 12)}`;
    
    // Save the payment intent ID to the appointment
    const { error: updateErr } = await supabaseAdmin
      .from('appointments')
      .update({ payment_id: mockPaymentId })
      .eq('id', appointmentId);

    if (updateErr) {
      throw updateErr;
    }

    // Return the client secret or checkout URL to the frontend
    return NextResponse.json({ 
      success: true, 
      paymentId: mockPaymentId,
      checkoutUrl: `/checkout/${mockPaymentId}` 
    });

  } catch (err: any) {
    console.error('Payment intent error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
