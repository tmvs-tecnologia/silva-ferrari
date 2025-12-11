const next = require('next');
const http = require('http');
const url = require('url');

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const hostname = 'localhost';
const app = next({ dev: true, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    http
      .createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);
        handle(req, res, parsedUrl);
      })
      .listen(port, '0.0.0.0', () => {
        console.log(`Ready on http://localhost:${port}/`);
      });
  })
  .catch((err) => {
    console.error('Failed to start dev server:', err);
    process.exit(1);
  });

