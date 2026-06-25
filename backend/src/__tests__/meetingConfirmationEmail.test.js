const {
  buildMeetingEmailHtml,
  getMeetingEmailSubject,
  getMeetingEmailText
} = require('../emails/meetingConfirmationEmail');

describe('meetingConfirmationEmail', () => {
  const sample = {
    name: 'Jane Doe',
    meetLink: 'https://meet.google.com/abc-defg-hij',
    preferredDate: '2026-06-15',
    preferredTime: '09:00',
    preferredTimezone: 'EST',
    service: 'Growth'
  };

  test('uses a clear subject line', () => {
    expect(getMeetingEmailSubject()).toBe('Your VoloLeads consultation is scheduled');
    expect(getMeetingEmailSubject({ isSubscriber: true })).toBe('Your VoloLeads onboarding call is scheduled');
  });

  test('includes meet link and schedule in plain text', () => {
    const text = getMeetingEmailText(sample);
    expect(text).toContain('Jane Doe');
    expect(text).toContain(sample.meetLink);
    expect(text).toContain('Growth');
  });

  test('includes meet link and CTA in html', () => {
    const html = buildMeetingEmailHtml(sample);
    expect(html).toContain(sample.meetLink);
    expect(html).toContain('Join Google Meet');
    expect(html).toContain('Growth');
  });
});
