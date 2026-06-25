const ContactForms = require('../repositories/contactForms');
const Subscriptions = require('../repositories/subscriptions');

const MAX_LIMIT = 500;

function parseAfterId(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function parseLimit(value) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 100;
  return Math.min(parsed, MAX_LIMIT);
}

function contactFormRowForSheet(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company || '',
    service: row.service,
    quantity: row.quantity || '',
    preferredDate: row.preferredDate || '',
    preferredTime: row.preferredTime || '',
    preferredTimezone: row.preferredTimezone,
    referralSource: row.referralSource,
    referralSourceOther: row.referralSourceOther || '',
    message: row.message || '',
    meetLink: row.meetLink || '',
    status: row.status,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function subscriptionRowForSheet(row) {
  return {
    id: row.id,
    email: row.email,
    planCode: row.planCode,
    status: row.status,
    stripeCustomerId: row.stripeCustomerId || '',
    stripeSubscriptionId: row.stripeSubscriptionId || '',
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    currentPeriodStart: row.currentPeriodStart || '',
    currentPeriodEnd: row.currentPeriodEnd || '',
    serviceAccessEndsAt: row.serviceAccessEndsAt || '',
    canceledAt: row.canceledAt || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

async function exportIncremental(req, res, { findAfterId, mapRow }) {
  try {
    const afterId = parseAfterId(req.query.after_id);
    const limit = parseLimit(req.query.limit);

    const rows = await findAfterId(afterId, limit);
    const sheetRows = rows.map(mapRow);
    const lastId = rows.length ? Number(rows[rows.length - 1].id) : afterId;

    return res.status(200).json({
      success: true,
      data: {
        rows: sheetRows,
        afterId,
        lastId,
        count: sheetRows.length,
        hasMore: sheetRows.length === limit
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Export failed'
    });
  }
}

exports.exportContactForms = (req, res) =>
  exportIncremental(req, res, {
    findAfterId: ContactForms.findAfterId,
    mapRow: contactFormRowForSheet
  });

exports.exportSubscriptions = (req, res) =>
  exportIncremental(req, res, {
    findAfterId: Subscriptions.findAfterId,
    mapRow: subscriptionRowForSheet
  });
