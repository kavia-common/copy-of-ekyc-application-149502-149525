'use strict';
const express = require('express');
const router = express.Router();
const healthService = require('../services/health');

// Basic health endpoint
router.get('/health', (req, res) => {
  const healthStatus = healthService.getStatus();
  res.status(200).json(healthStatus);
});

module.exports = router;
