# Dependency health monitoring

Monitor this production endpoint from a service outside cPanel:

`GET https://vololeads.com/api/health/dependencies`

Configure the monitor to run every five minutes. Treat only HTTP `200` with a JSON body containing `"status":"OK"` as healthy. Alert immediately on HTTP `503`, timeout, connection failure, or an unexpected response.

Enable both email and SMS alert contacts. Send a recovery notification after the endpoint returns healthy again. The response is intentionally sanitized and reports only `status` and `configured` for PostgreSQL, Google Calendar, SMTP, and Turnstile.

Do not monitor the shallow `/api/health` endpoint for dependency failures. It only confirms that Express is running.

Recommended production monitor settings:

- Interval: 5 minutes
- Timeout: 15 seconds
- Failure threshold: 1 check
- Recovery threshold: 2 consecutive successful checks
- Alerts: email and SMS
- Expected HTTP status: 200
- Expected body text: `"status":"OK"`

After deployment, first open the dependency endpoint manually, then submit a real test lead using a monitored inbox and phone number. Confirm the database record and admin email before considering the release complete.
