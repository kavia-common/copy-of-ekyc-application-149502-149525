/**
 * REQUIREMENT TRACEABILITY - Module: services/health.js
 * Non-functional monitoring helper
 * GxP Impact: YES (operational oversight); Risk: LOW
 */
class HealthService {
    /**
     * Get current service health snapshot.
     * Acceptance Criteria:
     * - AC-01: Includes status, message, timestamp, environment
     */
    getStatus() {
      return {
        status: 'ok',
        message: 'Service is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      };
    }
  }
  
module.exports = new HealthService();
