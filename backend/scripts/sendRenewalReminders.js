require('dotenv').config();

const connectDB = require('../src/config/db');
const { processRenewalReminders } = require('../src/controllers/billingController');

const isDryRun = process.argv.includes('--dry-run');
const atIndex = process.argv.indexOf('--at');
const atValue = atIndex >= 0 ? process.argv[atIndex + 1] : null;
const runAt = atValue ? new Date(atValue) : new Date();

if (atValue && Number.isNaN(runAt.getTime())) {
  console.error(`Invalid --at value: ${atValue}`);
  process.exit(1);
}

(async () => {
  await connectDB();
  const result = await processRenewalReminders(runAt, { dryRun: isDryRun });

  if (isDryRun) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      runAt: runAt.toISOString(),
      dueCount: result.dueCount,
      dueItems: result.dueItems.map(item => ({
        reminderKey: item.reminderKey,
        email: item.email,
        planCode: item.planCode,
        currentPeriodEnd: item.currentPeriodEnd
      }))
    }, null, 2));
  } else {
    console.log(`sent:${result.sentCount}`);
  }

  process.exit(0);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
