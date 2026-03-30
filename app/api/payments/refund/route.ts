import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requestMomoRefund } from '@/lib/services/momo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    // 1. Fetch appointment
    const { data: appointment, error: fetchErr } = await supabaseAdmin
      .from('appointments')
      .select('id, payment_status, payment_id, payment_trans_id, expert_base_price')
      .eq('id', appointmentId)
      .single();

    if (fetchErr || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Appointment is not paid, cannot refund' }, { status: 400 });
    }

    if (!appointment.payment_trans_id) {
      return NextResponse.json({ error: 'Missing payment trans ID on appointment' }, { status: 400 });
    }

    // 2. Call MoMo refund API
    // Ensure expert_base_price is available or fallback
    const amount = appointment.expert_base_price || 0;
    
    // In production, transaction ID would be an integer from MoMo.
    const transId = parseInt(appointment.payment_trans_id, 10);
    if (isNaN(transId)) {
        return NextResponse.json({ error: 'Invalid transId for MoMo' }, { status: 400 });
    }

    const result = await requestMomoRefund({
        orderId: appointment.id,
        amount,
        transId,
    });

    if (!result.success) {
      // In development or missing MoMo keys, fall back gracefully
      console.warn('MoMo refund failed:', result.message);
      
      if (!process.env.MOMO_PARTNER_CODE) {
        console.warn('WARNING: MoMo credentials missing, falling back to simulated refund');
        // Simulate refund success if credentials missing
      } else {
        return NextResponse.json({ error: result.message }, { status: 500 });
      }
    }

    // 3. Update database
    const { error: updateErr } = await supabaseAdmin
      .from('appointments')
      .update({
        payment_status: 'refunded',
        refund_status: 'completed'
      })
      .eq('id', appointmentId);

    if (updateErr) {
      return NextResponse.json({ error: 'Refund sent conceptually, but failed to update database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Refund successfully processed' });

  } catch (error: any) {
    console.error('Refund API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
