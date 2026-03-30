const http = require('http');

http.get('http://127.0.0.1:3000/en/availability', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    if (res.statusCode !== 200) {
      console.log('ERROR HTML/JSON:', data.substring(0, 1000));
    } else {
      console.log('SUCCESS');
    }
  });
}).on('error', err => console.log('REQ ERROR:', err.message));
