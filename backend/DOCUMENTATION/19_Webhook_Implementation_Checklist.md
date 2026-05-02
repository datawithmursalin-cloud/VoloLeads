# Stripe Webhook Implementation Checklist

## ✅ QUICK START (1-2 hours to implement)

### Step 1: Install Dependencies
```bash
cd backend
npm install stripe
```

### Step 2: Create 3 New Files
- ✅ `src/models/Payment.js` - Payment data model
- ✅ `src/controllers/webhookController.js` - Webhook logic
- ✅ `src/utils/emailService.js` - Email sending
- ✅ `src/routes/webhook.js` - Webhook endpoint
- ✅ `src/routes/payment.js` - Payment intent creation

### Step 3: Update 2 Existing Files
- ✅ `src/server.js` - Add webhook route (BEFORE json middleware!)
- ✅ `.env.example` - Add Stripe variables

### Step 4: Add Stripe Credentials
Get from Stripe Dashboard → Developers → API Keys

```env
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Get after creating webhook endpoint
```

### Step 5: Setup Webhook in Stripe
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhook/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy signing secret to `.env`

### Step 6: Test Locally
```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:5000/api/webhook/stripe

# Terminal 3
stripe trigger payment_intent.succeeded
```

---

## 📋 FILE CHECKLIST

### New Files to Create
- [ ] `src/models/Payment.js` (85 lines)
- [ ] `src/controllers/webhookController.js` (165 lines)
- [ ] `src/utils/emailService.js` (95 lines)
- [ ] `src/routes/webhook.js` (10 lines)
- [ ] `src/routes/payment.js` (50 lines)

### Files to Update
- [ ] `src/server.js` - Add webhook route before json()
- [ ] `.env.example` - Add Stripe & email variables
- [ ] `package.json` - Add stripe (already done if you ran npm install)

### Environment Variables to Add
```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@vololeads.com
ADMIN_DASHBOARD_URL=http://localhost:3000/admin
```

---

## 🔄 PAYMENT FLOW

1. Customer submits payment form
2. Frontend creates Stripe Payment Intent
3. Customer authorizes payment in Stripe
4. Stripe confirms payment
5. **Webhook triggered** → `/api/webhook/stripe`
6. Backend validates webhook signature
7. Payment saved to database
8. **Confirmation emails sent:**
   - Customer gets receipt
   - Admin gets notification
9. Done! ✅

---

## 📧 EMAIL TEMPLATES

### Customer Email
- Subject: "Payment Confirmation - VoloLeads"
- Contains: Amount, service, transaction ID, receipt link

### Admin Email
- Subject: "New Payment Received - $X.XX"
- Contains: Customer info, payment details, link to dashboard

---

## 🧪 TESTING

### Local Testing (Stripe CLI)
```bash
stripe listen --forward-to localhost:5000/api/webhook/stripe
stripe trigger payment_intent.succeeded
```

### Production Testing
Use test Stripe keys first (pk_test_, sk_test_)
Switch to live keys only after verified working

---

## ⚠️ IMPORTANT NOTES

### ⚠️ Webhook Route MUST come BEFORE json()
```javascript
// ✅ CORRECT ORDER:
app.post('/api/webhook/stripe', express.raw(...), webhook);
app.use(express.json());  // AFTER webhook

// ❌ WRONG - Will fail:
app.use(express.json());
app.post('/api/webhook/stripe', ...);  // Won't work!
```

### ⚠️ Keep Webhook Secret Safe
- Never commit `STRIPE_WEBHOOK_SECRET` to git
- Use `.env` file (not committed)
- Rotate secret if exposed

### ⚠️ Email Setup (Gmail)
1. Enable 2-factor authentication
2. Create app-specific password
3. Use app password in `.env` (NOT your main password)

---

## 🚀 DEPLOYMENT CHECKLIST

Before going to production:

- [ ] Switch to live Stripe keys (pk_live_, sk_live_)
- [ ] Update webhook endpoint URL to production domain
- [ ] Configure email service (Gmail or SendGrid)
- [ ] Test with real payment (use test card first)
- [ ] Verify emails send correctly
- [ ] Monitor webhook logs
- [ ] Set up error alerts
- [ ] Document webhook in team docs

---

## 📚 DOCUMENTATION

Full guide added to:
→ `DOCUMENTATION/18_STRIPE_Webhook_Setup.md`

Covers:
✅ Complete implementation steps
✅ Code for all 5 new files
✅ Server configuration
✅ Email service
✅ Stripe dashboard setup
✅ Local testing
✅ Troubleshooting

---

## 💬 COMMON ISSUES

**Problem:** "Webhook signature verification failed"
**Solution:** Check STRIPE_WEBHOOK_SECRET is correct in .env

**Problem:** "express.json() is parsing webhook body"
**Solution:** Move webhook route BEFORE `app.use(express.json())`

**Problem:** "Emails not sending"
**Solution:** 
- Check EMAIL_USER and EMAIL_PASSWORD
- Enable app-specific password for Gmail
- Check spam folder

**Problem:** "Payment not saved to database"
**Solution:**
- Verify MongoDB connection
- Check Payment model import
- Check logs for errors

---

## 🎯 NEXT STEPS

1. ✅ Install dependencies: `npm install stripe`
2. ✅ Create 5 new files (see guide)
3. ✅ Update 2 existing files
4. ✅ Add environment variables
5. ✅ Get Stripe credentials
6. ✅ Setup webhook in Stripe dashboard
7. ✅ Test with Stripe CLI
8. ✅ Deploy to production
9. ✅ Monitor webhooks

**Estimated time:** 2-3 hours for full implementation

---

## 📞 SUPPORT

Questions? Check:
1. `DOCUMENTATION/18_STRIPE_Webhook_Setup.md` - Full guide
2. Stripe documentation: https://stripe.com/docs/webhooks
3. Nodemailer docs: https://nodemailer.com/
4. Backend team chat

---

Ready to add payments with email confirmations! 💳✉️
