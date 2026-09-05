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
      'referralSourceOther', 'message', 'meetLink', 'status', 'source', 'createdAt', 'updatedAt'
    ]
  },
  subscriptions: {
    sheetName: 'Subscriptions',
    endpoint: '/api/export/subscriptions',
    lastIdKey: 'subscriptions_last_id',
    upsertById: true,
    headers: [
      'id', 'email', 'planCode', 'status', 'stripeCustomerId', 'stripeSubscriptionId',
      'cancelAtPeriodEnd', 'currentPeriodStart', 'currentPeriodEnd',
      'serviceAccessEndsAt', 'canceledAt', 'checkoutAmountTotalCents', 'currency',
      'discountAmountCents', 'promoCode', 'setupFeeIncluded', 'createdAt', 'updatedAt'
    ]
  }
};

function setupScriptProperties() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    API_BASE_URL: 'https://vololeads.com',
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
  }

  sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);

  let lastId = config.upsertById
    ? 0
    : parseInt(props.getProperty(config.lastIdKey) || '0', 10);
  let hasMore = true;
  const rowById = {};

  if (config.upsertById && sheet.getLastRow() > 1) {
    const existingIds = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    existingIds.forEach(function (row, index) {
      if (row[0] !== '' && row[0] !== null) {
        rowById[String(row[0])] = index + 2;
      }
    });
  }

  while (hasMore) {
    const url = baseUrl.replace(/\/$/, '') + config.endpoint
      + '?after_id=' + lastId + '&limit=500';

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + apiKey },
      muteHttpExceptions: true
    });

    const status = response.getResponseCode();
    const raw = response.getContentText() || '';
    let body;

    try {
      body = JSON.parse(raw || '{}');
    } catch (parseError) {
      const preview = raw.replace(/\s+/g, ' ').slice(0, 120);
      throw new Error(
        'Export returned HTML instead of JSON (' + status + '). '
        + 'Check API_BASE_URL (' + baseUrl + ') and that production has SHEETS_SYNC_API_KEY set. '
        + 'Preview: ' + preview
      );
    }

    if (status !== 200 || !body.success) {
      throw new Error('Export failed (' + status + '): ' + (body.message || raw));
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

    values.forEach(function (rowValues) {
      const idKey = String(rowValues[0]);
      const existingRow = config.upsertById ? rowById[idKey] : null;

      if (existingRow) {
        sheet.getRange(existingRow, 1, 1, config.headers.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
        if (config.upsertById) rowById[idKey] = sheet.getLastRow();
      }
    });

    lastId = body.data.lastId;
    if (!config.upsertById) {
      props.setProperty(config.lastIdKey, String(lastId));
    }
    hasMore = body.data.hasMore;
  }
}

function testApiConnection() {
  const props = PropertiesService.getScriptProperties();
  const baseUrl = props.getProperty('API_BASE_URL');
  const apiKey = props.getProperty('SYNC_API_KEY');

  Logger.log('API_BASE_URL: ' + (baseUrl || 'MISSING'));
  Logger.log('SYNC_API_KEY: ' + (apiKey ? 'set (' + apiKey.length + ' chars)' : 'MISSING'));

  if (!baseUrl || !apiKey) {
    throw new Error('Run setupScriptProperties() once, then check Project Settings → Script properties');
  }

  const healthUrl = baseUrl.replace(/\/$/, '') + '/api/health';
  const health = UrlFetchApp.fetch(healthUrl, { muteHttpExceptions: true });
  Logger.log('Health URL: ' + healthUrl);
  Logger.log('Health status: ' + health.getResponseCode());
  Logger.log('Health body: ' + health.getContentText().slice(0, 200));

  const exportUrl = baseUrl.replace(/\/$/, '') + '/api/export/contact-forms?after_id=0&limit=1';
  const response = UrlFetchApp.fetch(exportUrl, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + apiKey },
    muteHttpExceptions: true
  });

  Logger.log('Export URL: ' + exportUrl);
  Logger.log('Export status: ' + response.getResponseCode());
  Logger.log('Export body: ' + response.getContentText().slice(0, 300));
}
