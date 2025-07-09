const PaytmConfig = {
    MID: process.env.PAYTM_MID || 'Mobish80382601607975',
    WEBSITE: process.env.PAYTM_WEBSITE || 'DEFAULT',
    CHANNEL_ID: process.env.PAYTM_CHANNEL_ID || 'WEB',
    INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE_ID || 'Retail109',
    MERCHANT_KEY: process.env.PAYTM_MERCHANT_KEY || 'VrUA6E69o_R%a%te',
    CALLBACK_URL: process.env.PAYTM_CALLBACK_URL,
    PAYTM_URL: process.env.PAYTM_URL,
    STATUS_URL: process.env.PAYTM_STATUS_URL || 'https://securegw-stage.paytm.in/order/status'
  };
  
  module.exports = PaytmConfig;