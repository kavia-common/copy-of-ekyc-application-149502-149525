'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: routes/health.js
 * Covered Requirements:
 * - Non-functional: Availability/Monitoring endpoint
 * Related Stories: N/A
 * Validation Protocols: N/A
 * GxP Impact: YES (operational visibility; low risk)
 * Risk Level: LOW
 * RELEASE GATE CHECKLIST:
 * [x] Endpoint documented    [x] No sensitive data    [x] Health status structured
 */
const express = require('express');
const router = express.Router();
const healthService = require('../services/health');

/**
 * Endpoint: GET /health
 * REQ IDs: Operational monitoring (non-functional)
 * Acceptance Criteria:
 * - AC-01: Returns status ok with timestamp and environment
 * GxP Impact: YES — service availability evidence
 * Risk Level: LOW
 * Audit: Not applicable (no PII change)
 */
router.get('/health', (req, res) => {
  const healthStatus = healthService.getStatus();
  res.status(200).json(healthStatus);
});

module.exports = router;
