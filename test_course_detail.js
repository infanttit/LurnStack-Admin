const axios = require('axios');

async function run() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('https://api.lurnstack.com/api/admin/login', {
      email: 'testadmin@lurnstack.com',
      password: 'SecurePassword123'
    });

    const token = loginRes.data.token || loginRes.data.data?.token;
    console.log('Logged in successfully, token exists:', !!token);

    const client = axios.create({
      baseURL: 'https://api.lurnstack.com',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const courseId = '24e7f380-81d3-47df-9b21-56db9156f5c1';
    console.log(`\n--- GET /api/admin/courses/${courseId}/attendance-summary ---`);
    const res = await client.get(`/api/admin/courses/${courseId}/attendance-summary`);
    console.log('Status:', res.status);
    console.log('Keys:', Object.keys(res.data));
    console.log('Data Keys:', Object.keys(res.data.data || {}));
    console.log('Summary:', JSON.stringify(res.data.data?.summary || res.data.summary, null, 2));
    console.log('Occurrences Count:', (res.data.data?.occurrences || res.data.occurrences || []).length);
    if ((res.data.data?.occurrences || []).length > 0) {
      console.log('Sample occurrence:', JSON.stringify(res.data.data.occurrences[0], null, 2));
    }
  } catch (error) {
    console.error('Error fetching API:', error.response?.data || error.message);
  }
}

run();
