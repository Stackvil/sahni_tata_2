// Quick test script to verify server setup
import fetch from 'node-fetch';

const testEndpoint = async (url) => {
  try {
    console.log(`Testing: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.log(`✅ Success:`, data);
    return true;
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return false;
  }
};

(async () => {
  console.log('Testing backend server...\n');
  
  const healthCheck = await testEndpoint('http://localhost:3001/api/health');
  
  if (healthCheck) {
    console.log('\n✅ Backend server is running!');
    console.log('📚 Swagger docs: http://localhost:3001/api-docs');
  } else {
    console.log('\n❌ Backend server is not responding');
    console.log('Please start the server: cd backend && npm start');
  }
})();

