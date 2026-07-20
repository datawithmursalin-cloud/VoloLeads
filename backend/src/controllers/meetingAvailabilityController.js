const { getAvailableMeetingSlots } = require('../utils/meetingAvailability');
const logger = require('../utils/logger');

async function getMeetingAvailability(req, res) {
  try {
    const preferredDate = req.query.date || req.query.preferred_date;
    const preferredTimezone = req.query.timezone || req.query.preferred_timezone || 'EST';

    if (!preferredDate) {
      return res.status(400).json({
        success: false,
        message: 'A date query parameter is required.'
      });
    }

    const availability = await getAvailableMeetingSlots({
      preferredDate,
      preferredTimezone
    });

    return res.status(200).json({
      success: true,
      message: 'Meeting availability retrieved',
      data: availability
    });
  } catch (error) {
    logger.error(`Get meeting availability error: ${error.message}`);
    return res.status(503).json({
      success: false,
      code: 'SCHEDULING_UNAVAILABLE',
      message: 'Online scheduling is temporarily unavailable. Submit the form and we’ll contact you to schedule.',
      data: {
        date: req.query.date || req.query.preferred_date,
        timezone: req.query.timezone || req.query.preferred_timezone || 'EST',
        schedulingAvailable: false,
        slots: []
      }
    });
  }
}

module.exports = {
  getMeetingAvailability
};
