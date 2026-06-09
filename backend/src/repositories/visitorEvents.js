const { query } = require('../config/db');

function mapVisitorEvent(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    eventType: row.event_type,
    visitorHash: row.visitor_hash,
    pageUrl: row.page_url,
    pageReferrer: row.page_referrer,
    userAgentShort: row.user_agent_short,
    browser: row.browser,
    os: row.os,
    timeSpentSeconds: row.time_spent_seconds,
    customData: row.custom_data || {},
    timestamp: row.timestamp
  };
}

function buildDateFilters({ eventType, startDate, endDate, visitorHash }) {
  const values = [];
  const where = [];

  if (eventType) {
    values.push(eventType);
    where.push(`event_type = $${values.length}`);
  }

  if (visitorHash) {
    values.push(visitorHash);
    where.push(`visitor_hash = $${values.length}`);
  }

  if (startDate) {
    values.push(new Date(startDate));
    where.push(`timestamp >= $${values.length}`);
  }

  if (endDate) {
    values.push(new Date(endDate));
    where.push(`timestamp <= $${values.length}`);
  }

  return { values, where };
}

async function countRecentByVisitor(visitorHash, since) {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM visitor_events
     WHERE visitor_hash = $1 AND timestamp >= $2`,
    [visitorHash, since]
  );

  return result.rows[0]?.count || 0;
}

async function create(data) {
  const result = await query(
    `INSERT INTO visitor_events (
       event_type, visitor_hash, page_url, page_referrer, user_agent_short,
       browser, os, time_spent_seconds, custom_data, timestamp
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.eventType,
      data.visitorHash,
      data.pageUrl || null,
      data.pageReferrer || null,
      data.userAgentShort || null,
      data.browser || null,
      data.os || null,
      data.timeSpentSeconds || 0,
      data.customData || {},
      data.timestamp
    ]
  );

  return mapVisitorEvent(result.rows[0]);
}

async function findAll({ eventType, startDate, endDate, limit, skip }) {
  const { values, where } = buildDateFilters({ eventType, startDate, endDate });
  values.push(limit, skip);

  const result = await query(
    `SELECT *
     FROM visitor_events
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY timestamp DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows.map(mapVisitorEvent);
}

async function countAll({ eventType, startDate, endDate }) {
  const { values, where } = buildDateFilters({ eventType, startDate, endDate });
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM visitor_events
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
    values
  );

  return result.rows[0]?.count || 0;
}

async function getAnalytics({ startDate, endDate }) {
  const { values, where } = buildDateFilters({ startDate, endDate });
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [
    totalResult,
    uniqueResult,
    eventTypeResult,
    browserResult,
    avgTimeResult
  ] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM visitor_events ${whereClause}`, values),
    query(`SELECT COUNT(DISTINCT visitor_hash)::int AS count FROM visitor_events ${whereClause}`, values),
    query(
      `SELECT event_type AS id, COUNT(*)::int AS count
       FROM visitor_events
       ${whereClause}
       GROUP BY event_type
       ORDER BY count DESC`,
      values
    ),
    query(
      `SELECT browser AS id, COUNT(*)::int AS count
       FROM visitor_events
       ${whereClause}
       GROUP BY browser
       ORDER BY count DESC
       LIMIT 10`,
      values
    ),
    query(
      `SELECT COALESCE(AVG(time_spent_seconds), 0) AS average
       FROM visitor_events
       ${whereClause}`,
      values
    )
  ]);

  return {
    totalEvents: totalResult.rows[0]?.count || 0,
    uniqueVisitors: uniqueResult.rows[0]?.count || 0,
    eventTypes: eventTypeResult.rows.map(row => ({ _id: row.id, count: row.count })),
    topBrowsers: browserResult.rows.map(row => ({ _id: row.id, count: row.count })),
    avgTimeSpentSeconds: Math.round(Number(avgTimeResult.rows[0]?.average || 0))
  };
}

async function deleteByVisitorHash(visitorHash) {
  const result = await query('DELETE FROM visitor_events WHERE visitor_hash = $1', [visitorHash]);
  return result.rowCount;
}

module.exports = {
  countRecentByVisitor,
  create,
  findAll,
  countAll,
  getAnalytics,
  deleteByVisitorHash
};
