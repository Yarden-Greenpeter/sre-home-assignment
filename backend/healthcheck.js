const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  timeout: 2000,
  path: '/health'
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', function(err) {
  console.log('Health check failed:', err);
  process.exit(1);
});

request.end();