const mongoose = require('mongoose');

const contactFormSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      trim: true,
      maxlength: 150
    },
    service: {
      type: String,
      required: true,
      enum: ['Basic', 'Standard', 'Premium'],
      default: 'Standard'
    },
    quantity: {
      type: String,
      trim: true
    },
    preferredDate: {
      type: Date
    },
    preferredTime: {
      type: String,
      trim: true
    },
    preferredTimezone: {
      type: String,
      default: 'UTC'
    },
    referralSource: {
      type: String,
      required: true,
      enum: ['Google', 'LinkedIn', 'Facebook', 'Twitter', 'Referral', 'Other']
    },
    referralSourceOther: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    source: {
      type: String,
      default: 'website',
      enum: ['website', 'app', 'other']
    },
    status: {
      type: String,
      default: 'new',
      enum: ['new', 'contacted', 'converted', 'spam']
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'contact_forms'
  }
);

contactFormSchema.index({ email: 1 });
contactFormSchema.index({ createdAt: -1 });
contactFormSchema.index({ status: 1 });
contactFormSchema.index({ ipAddress: 1 });

module.exports = mongoose.model('ContactForm', contactFormSchema);
