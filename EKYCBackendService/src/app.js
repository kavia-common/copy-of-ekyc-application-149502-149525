const cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.set('trust proxy', true);

// JSON parser early so body is available to auditing middleware too
app.use(express.json());

// Health and root info first
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'EKYCBackendService running',
    docs: '/docs',
    openapi: '/openapi.json',
    health: '/health'
  });
});

// Health route
app.use('/', require('./routes/health'));

// Serve OpenAPI from interfaces/openapi.yaml parsed to JSON at /openapi.json
app.get('/openapi.json', (req, res) => {
  try {
    const yamlPath = path.join(__dirname, '..', 'interfaces', 'openapi.yaml');
    if (!fs.existsSync(yamlPath)) {
      return res.status(500).json({ code: 'SPEC_MISSING', message: 'OpenAPI YAML not found' });
    }
    const raw = fs.readFileSync(yamlPath, 'utf8');
    const spec = yaml.load(raw);

    // Ensure openapi and paths present
    if (!spec || !spec.openapi || !spec.paths || Object.keys(spec.paths).length === 0) {
      return res.status(500).json({ code: 'SPEC_INVALID', message: 'OpenAPI spec invalid or has empty paths' });
    }

    // Inject dynamic server URL
    const host = req.get('host');
    const protocol = req.secure ? 'https' : req.protocol;
    const actualPort = req.socket.localPort;
    const hasPort = host.includes(':');
    const needsPort = !hasPort && ((protocol === 'http' && actualPort !== 80) || (protocol === 'https' && actualPort !== 443));
    const fullHost = needsPort ? `${host}:${actualPort}` : host;
    spec.servers = [{ url: `${protocol}://${fullHost}` }];

    res.json(spec);
  } catch (e) {
    res.status(500).json({ code: 'SPEC_PARSE_ERROR', message: 'Failed to parse OpenAPI YAML' });
  }
});

// Optional: also serve the maintained spec file from interfaces if needed
app.get('/interfaces/openapi.yaml', (req, res) => {
  const p = path.join(__dirname, '..', 'interfaces', 'openapi.yaml');
  if (fs.existsSync(p)) {
    res.setHeader('Content-Type', 'application/yaml');
    res.send(fs.readFileSync(p, 'utf8'));
  } else {
    res.status(404).send('openapi.yaml not found');
  }
});

// Swagger UI using the parsed YAML via /openapi.json
app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, {
  swaggerUrl: '/openapi.json'
}));

// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/bank'));

// Unified error handling last
app.use(errorHandler);

module.exports = app;
