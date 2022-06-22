const https = require('https');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 1129;

const options = {
  key: fs.readFileSync('./ssls/myhufier_key.key'),
  cert: fs.readFileSync('./ssls/myhufier_crt.crt')
};

const httpsServer = https.createServer(options, app);
httpsServer.listen(PORT, '0.0.0.0', () => {
  console.log("Server listening on port: " + PORT + ` | https://localhost:${PORT}`);
});

// static resources should just be served as they are
app.use(express.static(
  path.resolve(__dirname, '..', 'uploads'),
  { maxAge: '30d' },
));