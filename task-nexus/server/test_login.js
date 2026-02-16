const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login with demo@tasknexus.com / demo123...');

        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'demo@tasknexus.com',
            password: 'demo123'
        });

        console.log('✓ Login successful!');
        console.log('Token:', response.data.token);
        console.log('User:', response.data.user);

    } catch (error) {
        console.error('✗ Login failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLogin();
