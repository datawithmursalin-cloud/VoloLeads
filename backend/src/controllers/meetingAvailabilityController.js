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
    return res.status(500).json({
      success: false,
      message: 'Unable to load meeting availability right now.'
    });
  }
}

module.exports = {
  getMeetingAvailability
};
