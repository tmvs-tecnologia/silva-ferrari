const http = require('http');
const fs = require('fs');

fs.writeFileSync('server_debug.log', 'Starting server...\n');

try {
  const server = http.createServer((req, res) => {
    res.end('OK');
  });

  server.listen(3005, (err) => {
    if (err) {
      fs.appendFileSync('server_debug.log', 'Error starting: ' + err.message);
    } else {
      fs.appendFileSync('server_debug.log', 'Server running on 3005\n');
      console.log('Server running on 3005');
    }
  });
  
  // Keep alive?
  setInterval(() => {
    fs.appendFileSync('server_debug.log', 'Heartbeat\n');
  }, 1000);

} catch (e) {
  fs.appendFileSync('server_debug.log', 'Fatal: ' + e.message);
}
