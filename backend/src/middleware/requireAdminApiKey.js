function requireAdminApiKey(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;

  if (!configured) {
    return res.status(503).json({
      success: false,
      message: 'Admin API is not configured on the server'
    });
  }

  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  const apiKey = bearer || req.headers['x-admin-api-key'];

  if (!apiKey || apiKey !== configured) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  return next();
}

module.exports = requireAdminApiKey;
