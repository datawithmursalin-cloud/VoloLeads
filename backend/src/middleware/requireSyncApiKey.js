function requireSyncApiKey(req, res, next) {
  const configured = process.env.SHEETS_SYNC_API_KEY;

  if (!configured) {
    return res.status(503).json({
      success: false,
      message: 'Sheet sync is not configured on the server'
    });
  }

  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  const apiKey = bearer || req.headers['x-sync-api-key'];

  if (!apiKey || apiKey !== configured) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  return next();
}

module.exports = requireSyncApiKey;
