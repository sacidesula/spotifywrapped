const axios = require('axios');

const TARGET_URL = 'http://localhost:3001'; 
const CONCURRENT_REQUESTS = 10; 
const TOTAL_REQUESTS = 1000; 

async function sendRequest(i) {
  try {
    const response = await axios.get(TARGET_URL);
    console.log(`Request #${i} - Status: ${response.status}`);
  } catch (error) {
    if (error.response) {
      console.log(`Request #${i} - Error Status: ${error.response.status}`);
    } else {
      console.log(`Request #${i} - Error: ${error.message}`);
    }
  }
}

async function runTest() {
  console.log(`Starting DDoS test on ${TARGET_URL}`);
  let requestsSent = 0;

  while (requestsSent < TOTAL_REQUESTS) {
    const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - requestsSent);
    const promises = [];

    for (let i = 0; i < batchSize; i++) {
      promises.push(sendRequest(requestsSent + i + 1));
    }

    await Promise.all(promises);
    requestsSent += batchSize;
  }

  console.log('DDoS test completed!');
}

runTest();
