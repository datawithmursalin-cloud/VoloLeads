const { query } = require('../config/db');

function mapContactForm(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    service: row.service,
    quantity: row.quantity,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    preferredTimezone: row.preferred_timezone,
    referralSource: row.referral_source,
    referralSourceOther: row.referral_source_other,
    message: row.message,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    source: row.source,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function countRecentByIp(ipAddress, since) {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM contact_forms
     WHERE ip_address = $1 AND created_at >= $2`,
    [ipAddress, since]
  );

  return result.rows[0]?.count || 0;
}

async function create(data) {
  const result = await query(
    `INSERT INTO contact_forms (
       name, email, phone, company, service, quantity, preferred_date,
       preferred_time, preferred_timezone, referral_source, referral_source_other,
       message, ip_address, user_agent, source, status, notes, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7,
       $8, $9, $10, $11,
       $12, $13, $14, $15, $16, $17, NOW(), NOW()
     )
     RETURNING *`,
    [
      data.name,
      data.email,
      data.phone,
      data.company || null,
      data.service,
      data.quantity || null,
      data.preferredDate || null,
      data.preferredTime || null,
      data.preferredTimezone,
      data.referralSource,
      data.referralSourceOther || null,
      data.message || null,
      data.ipAddress || null,
      data.userAgent || null,
      data.source,
      data.status || 'new',
      data.notes || null
    ]
  );

  return mapContactForm(result.rows[0]);
}

async function findAll({ status, limit, skip }) {
  const values = [];
  const where = [];

  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  values.push(limit, skip);

  const result = await query(
    `SELECT *
     FROM contact_forms
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY created_at DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows.map(mapContactForm);
}

async function countAll({ status }) {
  const values = [];
  const where = [];

  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM contact_forms
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
    values
  );

  return result.rows[0]?.count || 0;
}

async function findById(id) {
  const result = await query('SELECT * FROM contact_forms WHERE id = $1 LIMIT 1', [id]);
  return mapContactForm(result.rows[0]);
}

async function findAfterId(afterId, limit) {
  const result = await query(
    `SELECT *
     FROM contact_forms
     WHERE id > $1
     ORDER BY id ASC
     LIMIT $2`,
    [afterId, limit]
  );

  return result.rows.map(mapContactForm);
}

async function updateStatus(id, { status, notes }) {
  const result = await query(
    `UPDATE contact_forms
     SET status = $2,
         notes = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status, notes || null]
  );

  return mapContactForm(result.rows[0]);
}

module.exports = {
  countRecentByIp,
  create,
  findAll,
  findAfterId,
  countAll,
  findById,
  updateStatus
};
