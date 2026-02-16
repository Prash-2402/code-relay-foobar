require('dotenv').config();

// Test registration
async function testRegistration() {
    const newUser = {
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'Test@1234'
    };

    try {
        console.log('\n=== Testing Registration ===');
        console.log('Creating user:', newUser.email);

        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Registration successful!');
            console.log('User ID:', data.user.id);
            console.log('Username:', data.user.username);
            console.log('Email:', data.user.email);
            console.log('Token received:', data.token.substring(0, 20) + '...');
            return true;
        } else {
            console.log('❌ Registration failed:', data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Error during registration:', error.message);
        return false;
    }
}

// Test login with demo user
async function testDemoLogin() {
    const credentials = {
        email: 'demo@tasknexus.com',
        password: 'demo123'
    };

    try {
        console.log('\n=== Testing Demo Login ===');
        console.log('Email:', credentials.email);

        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login successful!');
            console.log('User ID:', data.user.id);
            console.log('Username:', data.user.username);
            console.log('Email:', data.user.email);
            console.log('Token received:', data.token.substring(0, 20) + '...');
            return true;
        } else {
            console.log('❌ Login failed:', data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Error during login:', error.message);
        return false;
    }
}

// Test login with new user
async function testNewUserLogin() {
    const credentials = {
        email: 'testuser@example.com',
        password: 'Test@1234'
    };

    try {
        console.log('\n=== Testing New User Login ===');
        console.log('Email:', credentials.email);

        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login successful!');
            console.log('User ID:', data.user.id);
            console.log('Username:', data.user.username);
            console.log('Email:', data.user.email);
            console.log('Token received:', data.token.substring(0, 20) + '...');
            return true;
        } else {
            console.log('❌ Login failed:', data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Error during login:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('🧪 Starting Authentication Tests...\n');

    await testDemoLogin();
    await testRegistration();
    await testNewUserLogin();

    console.log('\n✅ All tests completed!');
}

// Give the server time to start
setTimeout(runTests, 2000);
