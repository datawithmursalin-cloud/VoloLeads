/**
 * VoloLeads: PostgreSQL → Google Sheets (via backend export API)
 *
 * Setup:
 * 1. Deploy backend with SHEETS_SYNC_API_KEY set.
 * 2. Create a Google Sheet with tabs "Contact Forms" and "Subscriptions".
 * 3. Extensions → Apps Script → paste this file.
 * 4. Run setupScriptProperties() once and set API_BASE_URL + SYNC_API_KEY.
 * 5. Run syncAll() once for initial import.
 * 6. Triggers → Add trigger → syncAll → Time-driven (every 5 or 15 minutes).
 */

const SHEETS = {
  contactForms: {
    sheetName: 'Contact Forms',
    endpoint: '/api/export/contact-forms',
    lastIdKey: 'contact_forms_last_id',
    headers: [
      'id', 'name', 'email', 'phone', 'company', 'service', 'quantity',
      'preferredDate', 'preferredTime', 'preferredTimezone', 'referralSource',
      'referralSourceOther', 'message', 'status', 'source', 'createdAt', 'updatedAt'
    ]
  },
  subscriptions: {
    sheetName: 'Subscriptions',
    endpoint: '/api/export/subscriptions',
    lastIdKey: 'subscriptions_last_id',
    headers: [
      'id', 'email', 'planCode', 'status', 'stripeCustomerId', 'stripeSubscriptionId',
      'cancelAtPeriodEnd', 'currentPeriodStart', 'currentPeriodEnd',
      'serviceAccessEndsAt', 'canceledAt', 'createdAt', 'updatedAt'
    ]
  }
};

function setupScriptProperties() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    API_BASE_URL: 'https://your-api-host.example.com',
    SYNC_API_KEY: 'paste-the-same-value-as-SHEETS_SYNC_API_KEY'
  });
}

function syncAll() {
  syncDataset_(SHEETS.contactForms);
  syncDataset_(SHEETS.subscriptions);
}

function syncContactForms() {
  syncDataset_(SHEETS.contactForms);
}

function syncSubscriptions() {
  syncDataset_(SHEETS.subscriptions);
}

function syncDataset_(config) {
  const props = PropertiesService.getScriptProperties();
  const baseUrl = props.getProperty('API_BASE_URL');
  const apiKey = props.getProperty('SYNC_API_KEY');

  if (!baseUrl || !apiKey) {
    throw new Error('Set API_BASE_URL and SYNC_API_KEY via setupScriptProperties()');
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(config.sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(config.sheetName);
    sheet.appendRow(config.headers);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(config.headers);
  }

  let lastId = parseInt(props.getProperty(config.lastIdKey) || '0', 10);
  let hasMore = true;

  while (hasMore) {
    const url = baseUrl.replace(/\/$/, '') + config.endpoint
      + '?after_id=' + lastId + '&limit=500';

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + apiKey },
      muteHttpExceptions: true
    });

    const status = response.getResponseCode();
    const body = JSON.parse(response.getContentText() || '{}');

    if (status !== 200 || !body.success) {
      throw new Error('Export failed (' + status + '): ' + (body.message || response.getContentText()));
    }

    const rows = body.data.rows || [];
    if (rows.length === 0) {
      break;
    }

    const values = rows.map(function (row) {
      return config.headers.map(function (key) {
        const value = row[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return value;
      });
    });

    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, values.length, config.headers.length).setValues(values);

    lastId = body.data.lastId;
    props.setProperty(config.lastIdKey, String(lastId));
    hasMore = body.data.hasMore;
  }
}
