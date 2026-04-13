import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || '';

/**
 * Verify MoMo IPN signature
 * MoMo signs: accessKey + amount + extraData + message + orderId + orderInfo
 *             + orderType + partnerCode + payType + requestId + responseTime
 *             + resultCode + transId
 */
function verifyMomoSignature(body: Record<string, any>): boolean {
  if (!MOMO_SECRET_KEY) {
    // Dev mode: skip verification if no key configured
    console.warn('[Webhook] MOMO_SECRET_KEY not set — skipping signature verification');
    return true;
  }

  const {
    accessKey, amount, extraData, message, orderId, orderInfo,
    orderType, partnerCode, payType, requestId, responseTime,
    resultCode, transId, signature,
  } = body;

  const rawHash = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `message=${message}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `orderType=${orderType}`,
    `partnerCode=${partnerCode}`,
    `payType=${payType}`,
    `requestId=${requestId}`,
    `responseTime=${responseTime}`,
    `resultCode=${resultCode}`,
    `transId=${transId}`,
  ].join('&');

  const expectedSignature = crypto
    .createHmac('sha256', MOMO_SECRET_KEY)
    .update(rawHash)
    .digest('hex');

  return expectedSignature === signature;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[MoMo Webhook] Received:', JSON.stringify(body));

    // ── Verify signature ──────────────────────────────────────────────────
    if (!verifyMomoSignature(body)) {
      console.error('[MoMo Webhook] Invalid signature. Check MOMO_SECRET_KEY and request body.');
      // Log body keys (excluding signature for security) to help debugging
      const { signature: _sig, ...debugBody } = body;
      console.error('[MoMo Webhook] Debug info:', JSON.stringify(debugBody));
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { resultCode, orderId, transId, amount } = body;

    // ── Only process successful payments (resultCode === 0) ───────────────
    if (resultCode !== 0) {
      console.log(`[MoMo Webhook] Payment failed for orderId=${orderId}, resultCode=${resultCode}`);
      return NextResponse.json({ received: true, note: 'Payment not successful' });
    }

    if (!orderId) {
      console.error('[MoMo Webhook] Missing orderId in request body');
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // ── Update appointment payment status ─────────────────────────────────
    const { data: updatedAppointment, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({
        payment_status: 'paid',
        payment_trans_id: String(transId),
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', orderId)
      .eq('payment_status', 'unpaid')
      .select('id, user_id, expert_id, appointment_date')
      .single();

    if (updateError) {
      const { data: existing } = await supabaseAdmin
        .from('appointments')
        .select('payment_status')
        .eq('payment_id', orderId)
        .single();

      if (existing?.payment_status === 'paid') {
        console.log(`[MoMo Webhook] Order ${orderId} already processed (idempotent).`);
        return NextResponse.json({ received: true, note: 'Already processed' });
      }

      console.error(`[MoMo Webhook] DB Update Error for order ${orderId}:`, updateError);
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
    }

    if (!updatedAppointment) {
      console.warn('[MoMo Webhook] No appointment found for orderId:', orderId);
      return NextResponse.json({ received: true, note: 'Appointment not found' });
    }

    console.log('[MoMo Webhook] Payment confirmed for appointment:', updatedAppointment.id);

    // ── Send notifications to user and expert ─────────────────────────────
    try {
      const appointmentDate = updatedAppointment.appointment_date
        ? new Date(updatedAppointment.appointment_date).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
          })
        : '';

      const notifications = [
        {
          user_id: updatedAppointment.user_id,
          title: 'Thanh toán thành công',
          message: `Lịch hẹn ngày ${appointmentDate} đã được thanh toán thành công. Chuyên gia sẽ liên hệ xác nhận sớm.`,
          type: 'payment',
          is_read: false,
          metadata: { appointment_id: updatedAppointment.id, amount, trans_id: transId },
        },
        {
          user_id: updatedAppointment.expert_id,
          title: 'Lịch hẹn mới đã thanh toán',
          message: `Một người dùng vừa thanh toán lịch hẹn ngày ${appointmentDate}. Vui lòng xác nhận lịch hẹn.`,
          type: 'appointment',
          is_read: false,
          metadata: { appointment_id: updatedAppointment.id, amount, trans_id: transId },
        },
      ];

      const { error: notifyError } = await supabaseAdmin.from('notifications').insert(notifications);
      if (notifyError) {
        console.error('[MoMo Webhook] Notification error:', notifyError);
        // We don't return 500 here because the payment was already successfully updated in DB
      }
    } catch (notifyErr) {
       console.error('[MoMo Webhook] Unexpected notification error:', notifyErr);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[MoMo Webhook] Error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
