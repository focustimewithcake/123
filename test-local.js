// test-local.js
const handler = require('./netlify/functions/analyze-mindmap').handler;

const testEvent = {
  httpMethod: 'POST',
  body: JSON.stringify({
    text: 'Sơ đồ tư duy giúp tổ chức thông tin hiệu quả'
  })
};

handler(testEvent)
  .then(result => console.log('Result:', result))
  .catch(error => console.error('Error:', error));
