const axios = require('axios');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || 'ZhgFftfTdRizvzlcANHzWmHzSec7IFAWuFGmWdCyioz3uigkth';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || 'NXtApB0yHl6ciAfW72N9jjDM6iPTG7EEFwtlyGEV20Q5GaYxsd7m4qAYIPQGwDp0';
    this.shortCode = process.env.MPESA_SHORTCODE || '174379'; // Your business shortcode
    this.passKey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    
    // API URLs
    this.baseUrl = this.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  // Get OAuth token
  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  // Generate password for STK Push
  generatePassword() {
    const timestamp = this.getTimestamp();
    const password = Buffer.from(`${this.shortCode}${this.passKey}${timestamp}`).toString('base64');
    return { password, timestamp };
  }

  // Get timestamp in the format YYYYMMDDHHmmss
  getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  // Initiate STK Push (Lipa na M-Pesa)
  async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      // Format phone number (remove + or leading zeros, ensure it starts with 254)
      let formattedPhone = phoneNumber.replace(/\s+/g, '');
      if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
      }
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      }
      if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/wallet/mpesa/callback';

      const requestData = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount), // M-Pesa doesn't accept decimals
        PartyA: formattedPhone,
        PartyB: this.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
      };
    } catch (error) {
      console.error('Error initiating STK Push:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment');
    }
  }

  // Query STK Push status
  async querySTKPushStatus(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const requestData = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error querying STK Push status:', error.response?.data || error.message);
      throw new Error('Failed to query M-Pesa transaction status');
    }
  }

  // Process B2C payment (for refunds/withdrawals)
  async processB2C(phoneNumber, amount, remarks) {
    try {
      const accessToken = await this.getAccessToken();

      // Format phone number
      let formattedPhone = phoneNumber.replace(/\s+/g, '');
      if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
      }
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      }
      if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      const initiatorName = process.env.MPESA_INITIATOR_NAME || 'testapi';
      const securityCredential = process.env.MPESA_SECURITY_CREDENTIAL || 'Safaricom999!*!';
      const queueTimeOutURL = process.env.MPESA_TIMEOUT_URL || 'https://yourdomain.com/api/wallet/mpesa/timeout';
      const resultURL = process.env.MPESA_RESULT_URL || 'https://yourdomain.com/api/wallet/mpesa/result';

      const requestData = {
        InitiatorName: initiatorName,
        SecurityCredential: securityCredential,
        CommandID: 'BusinessPayment',
        Amount: Math.round(amount),
        PartyA: this.shortCode,
        PartyB: formattedPhone,
        Remarks: remarks || 'EcoLife Payment',
        QueueTimeOutURL: queueTimeOutURL,
        ResultURL: resultURL,
        Occasion: 'Withdrawal',
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error processing B2C payment:', error.response?.data || error.message);
      throw new Error('Failed to process M-Pesa withdrawal');
    }
  }
}

module.exports = new MpesaService();
