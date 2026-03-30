import crypto from 'crypto';

interface MomoRefundConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
}

interface MomoRefundRequest {
  orderId: string;
  amount: number;
  transId: number;
}

interface MomoRefundResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  transId: number;
  resultCode: number;
  message: string;
  responseTime: number;
}

const getConfig = (): MomoRefundConfig => {
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const endpoint = process.env.MOMO_REFUND_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/refund';

  if (!partnerCode || !accessKey || !secretKey) {
    throw new Error('Missing MoMo configuration in environment variables.');
  }

  return { partnerCode, accessKey, secretKey, endpoint };
};

/**
 * Send a refund request to MoMo API
 * Uses HMAC-SHA256 signature generation as required by MoMo standard integration
 */
export async function requestMomoRefund(data: MomoRefundRequest): Promise<{ success: boolean; message: string; data?: MomoRefundResponse }> {
  try {
    const config = getConfig();
    const requestId = `${data.orderId}_${new Date().getTime()}`;
    const description = `Refund for order ${data.orderId}`;
    
    // Create signature payload exactly per MoMo docs
    // format: accessKey=$accessKey&amount=$amount&description=$description&orderId=$orderId&partnerCode=$partnerCode&requestId=$requestId&transId=$transId
    const rawSignature = `accessKey=${config.accessKey}&amount=${data.amount}&description=${description}&orderId=${data.orderId}&partnerCode=${config.partnerCode}&requestId=${requestId}&transId=${data.transId}`;

    // Create HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', config.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: config.partnerCode,
      orderId: data.orderId,
      requestId: requestId,
      amount: data.amount,
      transId: data.transId,
      lang: 'vi',
      description: description,
      signature: signature,
    };

    console.log(`Sending MoMo Refund Request: ${requestId}`);

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MoMo API HTTP Error:', response.status, errorText);
      return { success: false, message: `MoMo API HTTP Error: ${response.status}` };
    }

    const responseData = await response.json() as MomoRefundResponse;

    // MoMo resultCode = 0 means success
    if (responseData.resultCode === 0) {
      return { 
        success: true, 
        message: 'Refund successful',
        data: responseData
      };
    } else {
      return { 
        success: false, 
        message: responseData.message || `Refund failed with code ${responseData.resultCode}`,
        data: responseData
      };
    }

  } catch (error: any) {
    console.error('MoMo SDK Error:', error);
    return { success: false, message: error.message || 'Unknown MoMo SDK Error' };
  }
}
