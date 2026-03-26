import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  try {
    // 1. Parse webhook payload
    const body = await request.json();
    
    // 2. In a real app, verify webhook signature here (e.g. Stripe signature)
    // const sig = request.headers.get('stripe-signature');
    // const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    
    // Mock extract event data
    const eventType = body.type; // e.g. 'payment_intent.succeeded'
    const eventData = body.data; 

    if (eventType !== 'payment_intent.succeeded') {
      return NextResponse.json({ received: true });
    }

    const paymentId = eventData.paymentId; 
    const transactionId = eventData.transactionId || `tx_${Math.random().toString(36).substring(2, 10)}`;

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing paymentId in webhook' }, { status: 400 });
    }

    // 3. Update the appointment safely using the admin client (bypasses RLS logic from frontend)
    const { data: updatedAppointment, error } = await supabaseAdmin
      .from('appointments')
      .update({ 
        payment_status: 'paid',
        payment_trans_id: transactionId,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId)
      .eq('payment_status', 'unpaid') // Ensure idempotency! Only update if unpaid
      .select()
      .single();

    if (error) {
      console.error('Webhook DB Update Error:', error);
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
    }

    if (!updatedAppointment) {
      // It was either already paid or doesn't exist. Since we ensure idempotency, it's fine.
      return NextResponse.json({ received: true, note: 'Already processed or not found' });
    }

    // 4. (Optional) Create a notification for the expert and user
    await supabaseAdmin.from('notifications').insert([
      {
        user_id: updatedAppointment.user_id,
        title: 'Payment Successful',
        message: 'Your appointment payment was successful.',
        type: 'payment'
      },
      {
        user_id: updatedAppointment.expert_id,
        title: 'New Appointment Paid',
        message: 'A user has paid for an upcoming appointment.',
        type: 'payment'
      }
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
