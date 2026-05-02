const VisitorEvent = require('../models/VisitorEvent');
const { hashIP, getClientIP, isValidURL } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.trackVisitorEvent = async (req, res) => {
  try {
    const { event_type, page_url, page_referrer, user_agent, time_spent_seconds, timestamp } = req.body;

    // Validate required fields
    if (!event_type || !timestamp) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: event_type, timestamp'
      });
    }

    const clientIP = getClientIP(req);
    const visitorHash = hashIP(clientIP);

    // Validate page URL if provided
    if (page_url && !isValidURL(page_url)) {
      logger.warn(`Invalid URL provided: ${page_url}`);
    }

    // Extract browser and OS info from user agent
    const userAgentString = user_agent || req.headers['user-agent'] || '';
    const { browser, os } = parseUserAgentSimple(userAgentString);

    // Prepare visitor event record
    const eventData = {
      eventType: event_type,
      visitorHash: visitorHash,
      pageUrl: page_url || req.headers.referer || '',
      pageReferrer: page_referrer || '',
      userAgentShort: userAgentString.substring(0, 256),
      browser: browser,
      os: os,
      timeSpentSeconds: Math.max(0, parseInt(time_spent_seconds) || 0),
      timestamp: new Date(timestamp)
    };

    // Rate limiting: max 100 events per visitor per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEvents = await VisitorEvent.countDocuments({
      visitorHash: visitorHash,
      timestamp: { $gte: oneHourAgo }
    });

    if (recentEvents >= 100) {
      logger.warn(`Rate limit exceeded for visitor: ${visitorHash}`);
      return res.status(429).json({ received: true });
    }

    // Store visitor event
    const visitorEvent = new VisitorEvent(eventData);
    await visitorEvent.save();

    logger.debug(`Visitor event tracked: ${event_type} from ${visitorHash}`);

    // Return 202 Accepted (fire-and-forget)
    return res.status(202).json({
      received: true
    });
  } catch (error) {
    logger.error(`Visitor tracking error: ${error.message}`);
    // Return 202 even on error so frontend doesn't retry
    return res.status(202).json({
      received: true
    });
  }
};

exports.getVisitorEvents = async (req, res) => {
  try {
    const { limit = 100, skip = 0, eventType, startDate, endDate } = req.query;

    const query = {};
    if (eventType) query.eventType = eventType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const events = await VisitorEvent
      .find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ timestamp: -1 });

    const total = await VisitorEvent.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Visitor events retrieved',
      data: {
        events,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip)
        }
      }
    });
  } catch (error) {
    logger.error(`Get visitor events error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve visitor events'
    });
  }
};

exports.getVisitorAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Get analytics aggregations
    const totalEvents = await VisitorEvent.countDocuments(query);
    const uniqueVisitors = await VisitorEvent.distinct('visitorHash', query);
    const eventTypeCounts = await VisitorEvent.aggregate([
      { $match: query },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const browserCounts = await VisitorEvent.aggregate([
      { $match: query },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const avgTimeSpent = await VisitorEvent.aggregate([
      { $match: query },
      { $group: { _id: null, average: { $avg: '$timeSpentSeconds' } } }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Analytics retrieved',
      data: {
        totalEvents,
        uniqueVisitors: uniqueVisitors.length,
        eventTypes: eventTypeCounts,
        topBrowsers: browserCounts,
        avgTimeSpentSeconds: Math.round(avgTimeSpent[0]?.average || 0)
      }
    });
  } catch (error) {
    logger.error(`Get analytics error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics'
    });
  }
};

exports.deleteVisitorData = async (req, res) => {
  try {
    const { visitorHash } = req.params;

    const result = await VisitorEvent.deleteMany({
      visitorHash: visitorHash
    });

    logger.info(`Deleted ${result.deletedCount} events for visitor: ${visitorHash}`);

    return res.status(200).json({
      success: true,
      message: 'Visitor data deleted (GDPR erasure)',
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    logger.error(`Delete visitor data error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete visitor data'
    });
  }
};

const parseUserAgentSimple = (userAgentString) => {
  let browser = 'Unknown';
  let os = 'Unknown';

  if (!userAgentString) return { browser, os };

  if (userAgentString.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgentString.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgentString.includes('Safari')) {
    browser = 'Safari';
  } else if (userAgentString.includes('Edge')) {
    browser = 'Edge';
  }

  if (userAgentString.includes('Windows')) {
    os = 'Windows';
  } else if (userAgentString.includes('Mac')) {
    os = 'macOS';
  } else if (userAgentString.includes('Linux')) {
    os = 'Linux';
  } else if (userAgentString.includes('Android')) {
    os = 'Android';
  } else if (userAgentString.includes('iPhone') || userAgentString.includes('iPad')) {
    os = 'iOS';
  }

  return { browser, os };
};
