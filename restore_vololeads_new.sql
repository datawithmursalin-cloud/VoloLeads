-- VoloLeads PostgreSQL schema + CSV backup restore
-- Run this while connected to the NEW database, as its owner/admin.
-- Backup rows: 16 contact forms, 6 subscriptions.

BEGIN;

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
  onboarding_meet_link TEXT,
  onboarding_calendar_event_id TEXT,
  onboarding_meeting_scheduled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  meet_link TEXT,
  calendar_event_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS subscriptions_email_idx ON subscriptions (email);
CREATE INDEX IF NOT EXISTS subscriptions_updated_at_idx ON subscriptions (updated_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_reminder_lookup_idx
  ON subscriptions (status, cancel_at_period_end, current_period_end, current_period_start);

CREATE INDEX IF NOT EXISTS contact_forms_email_idx ON contact_forms (email);
CREATE INDEX IF NOT EXISTS contact_forms_created_at_idx ON contact_forms (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_forms_status_idx ON contact_forms (status);
CREATE INDEX IF NOT EXISTS contact_forms_ip_address_idx ON contact_forms (ip_address);

CREATE INDEX IF NOT EXISTS visitor_events_visitor_hash_timestamp_idx
  ON visitor_events (visitor_hash, timestamp DESC);
CREATE INDEX IF NOT EXISTS visitor_events_event_type_timestamp_idx
  ON visitor_events (event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS visitor_events_page_url_timestamp_idx
  ON visitor_events (page_url, timestamp DESC);
CREATE INDEX IF NOT EXISTS visitor_events_timestamp_idx ON visitor_events (timestamp DESC);

INSERT INTO contact_forms
  (id, name, email, phone, company, service, quantity, preferred_date,
   preferred_time, preferred_timezone, referral_source, referral_source_other,
   message, status, source, created_at, updated_at)
VALUES
  ('1', 'digame', 'digame@bookline.io', '+15642247415', 'https://example.com', 'Premium', '2-3 Seats', NULL, NULL, 'EST', 'Skool', NULL, NULL, 'new', 'website', '2026-05-23T11:42:40.017Z'::timestamptz, '2026-05-23T11:42:40.017Z'::timestamptz),
  ('2', 'Tyrell Gale', 'swiftsellermarketing@gmail.com', '8152149864', 'SwiftSeller', 'Growth', '1 Seat', '2026-06-04T04:00:00.000Z'::timestamptz, '09:00', 'EST', 'Discord', NULL, 'Found you guys from college of wholesaling Arya.', 'new', 'website', '2026-06-03T23:34:53.499Z'::timestamptz, '2026-06-03T23:34:53.499Z'::timestamptz),
  ('4', 'Jonathan De Diego', 'usahomebuyers2025@gmail.com', '2407168859', NULL, 'Growth', '1 Seat', '2026-06-09T04:00:00.000Z'::timestamptz, '10:00', 'EST', 'College of Wholesale', NULL, 'I want to make this my full time job but I find it hard finding hot leads so I want to see if the leads are hot or I would need to work on it more.', 'new', 'website', '2026-06-06T10:47:57.749Z'::timestamptz, '2026-06-06T10:47:57.749Z'::timestamptz),
  ('7', 'Zack Lazarian', 'zacklazarian0@gmail.com', '781-640-4674', 'Mazal Home Buyers', 'Starter', '1 Seat', '2026-06-11T04:00:00.000Z'::timestamptz, '11:00', 'EST', 'Other', 'Tiktok - Code COW2026', 'Looking for a cold call company that preforms well', 'new', 'website', '2026-06-11T03:56:13.643Z'::timestamptz, '2026-06-11T03:56:13.643Z'::timestamptz),
  ('10', 'Michael Rappaport', 'michael@rappcohomesolutions.com', '3477614326', 'Rappco Home Solutions', 'Growth', '1 Seat', '2026-06-25T04:00:00.000Z'::timestamptz, '16:00', 'EST', 'College of Wholesale', NULL, '1-2 deals per month', 'new', 'website', '2026-06-24T19:45:07.453Z'::timestamptz, '2026-06-24T19:45:07.453Z'::timestamptz),
  ('12', 'Samiyeel Alim', 'benaaf2000@gmail.com', '8801973437933', 'Dhaka Housing', 'Growth', '2-3 Seats', '2026-06-26T04:00:00.000Z'::timestamptz, '09:00', 'EST', 'Skool', NULL, 'Test', 'new', 'website', '2026-06-24T20:33:52.592Z'::timestamptz, '2026-06-24T20:33:52.592Z'::timestamptz),
  ('13', 'Samiyeel Alim', 'benaaf2000@gmail.com', '8801973437933', 'Dhaka Housing', 'Growth', '2-3 Seats', '2026-06-26T04:00:00.000Z'::timestamptz, '09:00', 'EST', 'Facebook', NULL, 'Test', 'new', 'website', '2026-06-24T20:50:42.280Z'::timestamptz, '2026-06-24T20:50:42.280Z'::timestamptz),
  ('14', 'Michael Rappaport', 'michael@rappcohomesolutions.com', '3477614326', 'Rappco Home Solutions', 'Growth', '1 Seat', '2026-06-26T04:00:00.000Z'::timestamptz, '16:00', 'EST', 'College of Wholesale', NULL, '1-2 deals per month', 'new', 'website', '2026-06-24T21:22:16.882Z'::timestamptz, '2026-06-24T21:22:16.882Z'::timestamptz),
  ('15', 'Samiyeel Alim', 'benaaf2000@gmail.com', '8801973437933', 'Dhaka Housing', 'Custom Quote', NULL, '2026-07-21T04:00:00.000Z'::timestamptz, '09:00', 'EST', 'Discord', NULL, 'yada yada yada', 'new', 'website', '2026-07-20T12:00:11.690Z'::timestamptz, '2026-07-20T12:00:11.690Z'::timestamptz),
  ('16', 'Samiyeel Alim', 'benaaf2000@gmail.com', '8801973437933', 'Dhaka Housing', 'Scale', '10+ Seats', '2026-07-21T04:00:00.000Z'::timestamptz, '09:30', 'EST', 'Facebook', NULL, 'yadayadayada', 'new', 'website', '2026-07-20T17:50:23.203Z'::timestamptz, '2026-07-20T17:50:23.203Z'::timestamptz),
  ('17', 'Antonio Glenn', 'tony.envisionlandsolutions@gmail.com', '3125231476', 'KJT Property Solutions', 'Starter', '1 Seat', '2026-08-08T04:00:00.000Z'::timestamptz, '11:00', 'EST', 'College of Wholesale', NULL, 'I want to have someone make calls for me, and bring me warm leads. I want someone to make calls for 4 hours per day Monday through Friday until we are able to close a few deals.', 'new', 'website', '2026-08-07T11:45:56.252Z'::timestamptz, '2026-08-07T11:45:56.252Z'::timestamptz),
  ('18', 'salim abbul', 'salsourcer@gmail.com', '8777312404', NULL, 'Essential', '1 Seat', '2026-08-09T04:00:00.000Z'::timestamptz, '09:00', 'EST', 'Other', 'GOOGLE', 'i want a dedicated wholesale cold-caller to target and qualify motivated sellers consistently and pass me the leads that are qualified so i can begin the acquisition process.', 'new', 'website', '2026-08-09T11:25:35.880Z'::timestamptz, '2026-08-09T11:25:35.880Z'::timestamptz),
  ('19', 'salim abbul', 'salsourcer@gmail.com', '18777312404', NULL, 'Essential', '1 Seat', '2026-08-10T04:00:00.000Z'::timestamptz, '11:00', 'EST', 'Other', 'google', 'i want a dedicated wholesale cold-caller to target and qualify motivated sellers consistently and pass me the leads that are qualified so i can begin the acquisition process.', 'new', 'website', '2026-08-09T13:44:50.767Z'::timestamptz, '2026-08-09T13:44:50.767Z'::timestamptz),
  ('20', 'John T', 'johntok5000@gmail.com', '3132690891', NULL, 'Essential', '1 Seat', '2026-08-12T04:00:00.000Z'::timestamptz, '15:00', 'EST', 'Discord', NULL, 'I’m looking for a VA who can help me communicate with Zillow agents and qualify properties before we spend time pursuing them further.

The VA would call the listing agents to gather key information, including:

* Current rental income and/or potential rental income
* Whether the property is turnkey or needs repairs
* Whether the seller is open to creative financing or creative offers, especially if the property has been sitting on the market for several months
* What the seller is looking for in terms of price, down payment, monthly payment, or other terms
* Any other details the agent can provide that would help us determine if the property is a good fit

I’d also like the VA to be proactive in asking agents whether they have **other listings, upcoming listings, or portfolios of properties** that may fit our criteria. The goal is to build relationships with agents and uncover additional opportunities beyond the specific property we initially contacted them about.

The VA should identify and prioritize properties where the seller is open to **creative terms and/or turnkey properties**.

Following up with agents by text will also be an important part of the role. The VA should be comfortable maintaining ongoing communication, following up on promising properties, and asking agents about additional opportunities as they become available.

Overall, I’m looking for someone who is proactive, comfortable speaking with real estate agents, asks the right questions, documents the information clearly, and consistently follows up. Ideally, they can help us build a pipeline of properties and agent relationships that fit our investment criteria', 'new', 'website', '2026-08-11T08:24:04.451Z'::timestamptz, '2026-08-11T08:24:04.451Z'::timestamptz),
  ('21', 'Onetia Cameron', 'onetiasellsfl@gmail.com', '2393212205', NULL, 'Essential', '1 Seat', '2026-08-20T04:00:00.000Z'::timestamptz, '16:30', 'EST', 'Facebook', NULL, 'Do you work with Realtors? Goal is to sell 20 homes this year.', 'new', 'website', '2026-08-18T13:15:28.425Z'::timestamptz, '2026-08-18T13:15:28.425Z'::timestamptz),
  ('22', 'Jake Wais', 'waisjake00@gmail.com', '17046418910', 'Directsourceproperties', 'Growth', '1 Seat', '2026-08-27T04:00:00.000Z'::timestamptz, '10:30', 'EST', 'College of Wholesale', NULL, 'Hey what''s up I am a friend of aryas he told me about you guys and how good you guys are at getting some quality leads in. I have recently done some ppl and sms and am ready to hire some cold callers. I''ve closed a couple of deals and want to get to a consistent 1-3 deals a month.', 'new', 'website', '2026-08-25T16:50:04.674Z'::timestamptz, '2026-08-25T16:50:04.674Z'::timestamptz)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  company = EXCLUDED.company,
  service = EXCLUDED.service,
  quantity = EXCLUDED.quantity,
  preferred_date = EXCLUDED.preferred_date,
  preferred_time = EXCLUDED.preferred_time,
  preferred_timezone = EXCLUDED.preferred_timezone,
  referral_source = EXCLUDED.referral_source,
  referral_source_other = EXCLUDED.referral_source_other,
  message = EXCLUDED.message,
  status = EXCLUDED.status,
  source = EXCLUDED.source,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO subscriptions
  (id, email, plan_code, status, stripe_customer_id, stripe_subscription_id,
   cancel_at_period_end, current_period_start, current_period_end,
   service_access_ends_at, canceled_at, created_at, updated_at)
VALUES
  ('44', 'kris60639@gmail.com', 'premium_monthly', 'active', 'cus_Uh1CLprcXiPDUh', 'sub_1ThdALDFI7yfJC2qKaCDoOyH', FALSE, '2026-06-12T22:03:05.000Z'::timestamptz, '2026-07-12T22:03:05.000Z'::timestamptz, '2026-07-12T22:03:05.000Z'::timestamptz, NULL, '2026-06-13T08:04:03.275Z'::timestamptz, '2026-06-13T08:04:03.275Z'::timestamptz),
  ('45', 'mich.rappap@gmail.com', 'premium_monthly', 'active', 'cus_UnnwCVZl3mIzEt', 'sub_1ToCKgDFI7yfJC2qYWWFCpnE', FALSE, '2026-07-01T00:48:54.000Z'::timestamptz, '2026-08-01T00:48:54.000Z'::timestamptz, '2026-08-01T00:48:54.000Z'::timestamptz, NULL, '2026-07-01T13:42:48.461Z'::timestamptz, '2026-07-01T13:42:48.461Z'::timestamptz),
  ('48', 'mich.rappap@gmail.com', 'premium_monthly', 'incomplete_expired', 'cus_UnnqYhQ5HhMKqS', 'sub_1ToCEbDFI7yfJC2q5n6xYteC', FALSE, '2026-07-01T00:42:37.000Z'::timestamptz, '2026-08-01T00:42:37.000Z'::timestamptz, '2026-08-01T00:42:37.000Z'::timestamptz, '2026-07-01T23:43:15.000Z'::timestamptz, '2026-07-01T23:43:17.355Z'::timestamptz, '2026-07-01T23:43:17.356Z'::timestamptz),
  ('53', 'tony.envisionlandsolutions@gmail.com', 'essential_weekly', 'past_due', 'cus_V1f7Czy83hdVSQ', 'sub_1U1bmtDFI7yfJC2qnULBlXsp', FALSE, '2026-08-07T00:37:27.000Z'::timestamptz, '2026-09-07T00:37:27.000Z'::timestamptz, '2026-09-07T00:37:27.000Z'::timestamptz, NULL, '2026-08-07T00:37:31.391Z'::timestamptz, '2026-08-07T00:38:17.821Z'::timestamptz),
  ('59', 'tony.envisionlandsolutions@gmail.com', 'essential_monthly', 'active', 'cus_V2JN8K2C1u0kFR', 'sub_1U2EkQDFI7yfJC2qZabPQ8EQ', FALSE, '2026-08-08T18:13:30.000Z'::timestamptz, '2026-09-08T18:13:30.000Z'::timestamptz, '2026-09-08T18:13:30.000Z'::timestamptz, NULL, '2026-08-08T18:13:34.229Z'::timestamptz, '2026-08-08T18:14:13.953Z'::timestamptz),
  ('67', 'tony.envisionlandsolutions@gmail.com', 'unknown_plan', 'active', 'cus_V3inoMgrBUCRie', 'sub_1U3bMMDFI7yfJC2qsrwz0Vo2', FALSE, '2026-08-12T12:34:14.000Z'::timestamptz, '2026-09-12T12:34:14.000Z'::timestamptz, '2026-09-12T12:34:14.000Z'::timestamptz, NULL, '2026-08-12T12:34:20.909Z'::timestamptz, '2026-08-12T12:34:20.967Z'::timestamptz)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  plan_code = EXCLUDED.plan_code,
  status = EXCLUDED.status,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  cancel_at_period_end = EXCLUDED.cancel_at_period_end,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  service_access_ends_at = EXCLUDED.service_access_ends_at,
  canceled_at = EXCLUDED.canceled_at,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

SELECT setval(pg_get_serial_sequence('contact_forms', 'id'),
              COALESCE((SELECT MAX(id) FROM contact_forms), 1), true);
SELECT setval(pg_get_serial_sequence('subscriptions', 'id'),
              COALESCE((SELECT MAX(id) FROM subscriptions), 1), true);

-- The role from your error. Run this section as the database owner/admin.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vololead_app_new') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO "vololead_app_new"';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "vololead_app_new"';
    EXECUTE 'GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO "vololead_app_new"';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "vololead_app_new"';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO "vololead_app_new"';
  END IF;
END $$;

COMMIT;

-- Verification:
-- SELECT COUNT(*) FROM contact_forms;
-- SELECT COUNT(*) FROM subscriptions;
-- SELECT MAX(id) FROM contact_forms;
-- SELECT MAX(id) FROM subscriptions;

