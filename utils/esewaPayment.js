// ============ ESEWA PAYMENT UTILITY (CREATED FOR APPOINTMENT PAYMENT INTEGRATION) ============
// This file handles eSewa payment signature generation and verification
// Based on eSewa Epay-V2 API documentation: https://developer.esewa.com.np/pages/Epay-V2

const crypto = require('crypto');

/**
 * Generate eSewa payment form data for appointments
 * @param {Object} appointmentData - Contains totalAmount, transactionUUID, successUrl, failureUrl
 * @returns {Object} Form data to send to eSewa
 */
exports.generateEsewaFormData = (appointmentData) => {
  const {
    totalAmount,
    transactionUUID,
    productCode = 'EPAYTEST',
    successUrl,
    failureUrl
  } = appointmentData;

  // Use secret key from environment or fallback to test key
  const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';

  // 1. Format Amount (2 decimal places)
  const formattedAmount = Number(totalAmount).toFixed(2);

  // 2. Create Signature String
  const signatureString = `total_amount=${formattedAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`;

  // 3. Generate HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signatureString)
    .digest('base64');

  return {
    amount: formattedAmount,
    tax_amount: "0",
    product_service_charge: "0",
    product_delivery_charge: "0",
    total_amount: formattedAmount,
    transaction_uuid: transactionUUID,
    product_code: productCode,
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: signature
  };
};

/**
 * Verify eSewa Response Signature
 * @param {Object} data - Response data from eSewa
 * @returns {Boolean} True if signature is valid
 */
exports.verifyEsewaPayment = (data) => {
  const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
  
  try {
    // 1. Get the list of fields eSewa signed
    const signedFieldNames = data.signed_field_names;

    // 2. Build the signature string dynamically
    const signatureString = signedFieldNames
      .split(',')
      .map(field => `${field}=${data[field]}`)
      .join(',');

    // 3. Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureString)
      .digest('base64');

    // 4. Debug Logs
    console.log("___ ESEWA SIGNATURE VERIFICATION ___");
    console.log("Signature String:", signatureString);
    console.log("Received Signature:", data.signature);
    console.log("Expected Signature:", expectedSignature);
    console.log("Match:", data.signature === expectedSignature);
    
    return data.signature === expectedSignature;
  } catch (error) {
    console.error("Signature Verification Error:", error);
    return false;
  }
};

/**
 * Generate unique transaction UUID for each payment
 * @returns {String} Unique transaction UUID
 */
exports.generateTransactionUUID = () => {
  return `APT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// ============ END ESEWA PAYMENT UTILITY ============