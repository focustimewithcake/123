const crypto = require('crypto');
const db = require('./db.js');

const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMOIQA420180417",
  accessKey: process.env.MOMO_ACCESS_KEY || "SvDmj2cOTYZmQQ3H",
  secretKey: process.env.MOMO_SECRET_KEY || "PPuXqPk5fvJVEKtM1G0oQf0pVl2XCxx6",
  endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create"
};

function generateSignature(rawSignature) {
  // ... (code đầy đủ từ trước)
}

exports.handler = async (event) => {
  // ... (code handler đầy đủ từ trước)
};
