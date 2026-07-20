const express = require('express');
const { checkDependencies } = require('../utils/dependencyHealth');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});


router.get('/dependencies', async (req, res) => {
  try {
    const results = await checkDependencies();
    const dependencies = Object.fromEntries(
      Object.entries(results).map(([name, result]) => [
        name,
        {
          status: result.status === 'ok' ? 'ok' : 'error',
          configured: Boolean(result.configured)
        }
      ])
    );
    const healthy = Object.values(dependencies).every((dependency) => dependency.status === 'ok');

    res.set('Cache-Control', 'no-store');
    return res.status(healthy ? 200 : 503).json({
      success: healthy,
      status: healthy ? 'OK' : 'DEGRADED',
      message: healthy ? 'All dependencies are healthy' : 'One or more dependencies are unavailable',
      dependencies,
      timestamp: new Date().toISOString()
    });
  } catch (_) {
    return res.status(503).json({
      success: false,
      status: 'DEGRADED',
      message: 'Dependency health check failed',
      dependencies: {},
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
