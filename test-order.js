const fetch = require('node-fetch');

async function run() {
  const fileRef = "d7d498aa-e192-4217-bc45-ddbfce7de2c6"; // Mock or any uuid
  const payload = {
    fileId: fileRef,
    config: { material: 'pla', infill: 20, scale: 1, quality: 'standard', finish: 'raw' },
    price: 1500,
    customerInfo: { firstName: 'Test', lastName: 'User', email: 'test@test.com', phone: '123' },
    shippingInfo: { streetAddress: '12', city: 'A', state: 'A', zip: '1', country: 'IN', method: 'S', cost: 100 }
  };

  try {
    const res = await fetch('https://api.pulsewritexsolutions.com/api/three-d-printing/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error(err);
  }
}
run();
