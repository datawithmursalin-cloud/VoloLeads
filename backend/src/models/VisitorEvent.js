const mongoose = require('mongoose');

const visitorEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ['page_visit', 'page_exit', 'button_click', 'form_start', 'form_submit', 'scroll', 'custom'],
      index: true
    },
    visitorHash: {
      type: String,
      required: true,
      index: true
    },
    pageUrl: {
      type: String,
      trim: true
    },
    pageReferrer: {
      type: String,
      trim: true
    },
    userAgentShort: {
      type: String,
      trim: true
    },
    browser: {
      type: String,
      trim: true
    },
    os: {
      type: String,
      trim: true
    },
    timeSpentSeconds: {
      type: Number,
      default: 0
    },
    customData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
      expires: 15552000
    }
  },
  {
    collection: 'visitor_events',
    timestamps: false
  }
);

visitorEventSchema.index({ visitorHash: 1, timestamp: -1 });
visitorEventSchema.index({ eventType: 1, timestamp: -1 });
visitorEventSchema.index({ pageUrl: 1, timestamp: -1 });
visitorEventSchema.index({ timestamp: -1 });

module.exports = mongoose.model('VisitorEvent', visitorEventSchema);
