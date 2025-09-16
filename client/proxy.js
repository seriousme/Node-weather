import { createServer } from 'node:http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({});

createServer((req, res) => {
  // Replace with your actual CouchDB URL
  proxy.web(req, res, { target: 'http://couchdbhost:5984' });
}).listen(5984);

console.log('Proxy listening on http://localhost:5984');