const axios = require('axios');
axios.post('http://localhost:3000/api/auth/login', { username: 'testadmin', password: 'Test123!' })
  .then(res => console.log('SUCCESS:', res.data))
  .catch(err => {
    console.error('ERROR:');
    if (err.response) {
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }
  });
