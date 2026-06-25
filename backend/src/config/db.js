const { Pool } = require('pg');

let pool;

function shouldUseSsl() {
  if (process.env.DATABASE_SSL === 'false') return false;

  const databaseUrl = process.env.DATABASE_URL || '';
  return !/localhost|127\.0\.0\.1/i.test(databaseUrl);
}

async function initSchema() {
  const client = getPool();

  await client.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT UNIQUE,
      stripe_checkout_session_id TEXT UNIQUE,
      plan_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      service_access_ends_at TIMESTAMPTZ,
      canceled_at TIMESTAMPTZ,
      reminder_week3_sent_at TIMESTAMPTZ,
      reminder_day3_sent_at TIMESTAMPTZ,
      reminder_day1_sent_at TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS reminder_week3_sent_at TIMESTAMPTZ;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS reminder_day3_sent_at TIMESTAMPTZ;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS reminder_day1_sent_at TIMESTAMPTZ;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS onboarding_meet_link TEXT;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS onboarding_calendar_event_id TEXT;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS onboarding_meeting_scheduled_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS subscriptions_email_idx ON subscriptions (email);
    CREATE INDEX IF NOT EXISTS subscriptions_updated_at_idx ON subscriptions (updated_at DESC);
    CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions (stripe_customer_id);
    CREATE INDEX IF NOT EXISTS subscriptions_reminder_lookup_idx ON subscriptions (status, cancel_at_period_end, current_period_end, current_period_start);

    CREATE TABLE IF NOT EXISTS contact_forms (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT,
      service TEXT NOT NULL DEFAULT 'Standard',
      quantity TEXT,
      preferred_date TIMESTAMPTZ,
      preferred_time TEXT,
      preferred_timezone TEXT NOT NULL DEFAULT 'UTC',
      referral_source TEXT NOT NULL,
      referral_source_other TEXT,
      message TEXT,
      ip_address TEXT,
      user_agent TEXT,
      source TEXT NOT NULL DEFAULT 'website',
      status TEXT NOT NULL DEFAULT 'new',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS contact_forms_email_idx ON contact_forms (email);
    CREATE INDEX IF NOT EXISTS contact_forms_created_at_idx ON contact_forms (created_at DESC);
    CREATE INDEX IF NOT EXISTS contact_forms_status_idx ON contact_forms (status);
    CREATE INDEX IF NOT EXISTS contact_forms_ip_address_idx ON contact_forms (ip_address);

    ALTER TABLE contact_forms ADD COLUMN IF NOT EXISTS meet_link TEXT;
    ALTER TABLE contact_forms ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;

    CREATE TABLE IF NOT EXISTS visitor_events (
      id BIGSERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      page_url TEXT,
      page_referrer TEXT,
      user_agent_short TEXT,
      browser TEXT,
      os TEXT,
      time_spent_seconds INTEGER NOT NULL DEFAULT 0,
      custom_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS visitor_events_visitor_hash_timestamp_idx ON visitor_events (visitor_hash, timestamp DESC);
    CREATE INDEX IF NOT EXISTS visitor_events_event_type_timestamp_idx ON visitor_events (event_type, timestamp DESC);
    CREATE INDEX IF NOT EXISTS visitor_events_page_url_timestamp_idx ON visitor_events (page_url, timestamp DESC);
    CREATE INDEX IF NOT EXISTS visitor_events_timestamp_idx ON visitor_events (timestamp DESC);
  `);
}

async function connectDB() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not configured. PostgreSQL features are disabled.');
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: shouldUseSsl() ? { rejectUnauthorized: false } : false
    });
  }

  await pool.query('SELECT 1');
  await initSchema();
  console.log('PostgreSQL connected');
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

module.exports = connectDB;
module.exports.query = query;
module.exports.getPool = getPool;
