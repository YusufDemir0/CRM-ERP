const axios = require('axios');
async function test() {
  try {
    const login = await axios.post('http://localhost:3000/api/auth/login', { username: 'admin', password: 'password123' });
    const token = login.data.accessToken;
    const res = await axios.get('http://localhost:3000/api/departments?sortBy=name&sortOrder=DESC', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(res.data.data.map(d => d.name));
  } catch (e) { console.error(e.response?.data || e.message); }
}
test();
