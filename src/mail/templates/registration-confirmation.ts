interface RegistrationEmailData {
  fullName: string;
  email: string;
  eventName: string;
  ticketCategoryName: string;
  eventDateStart: Date;
  eventDateEnd: Date;
  referenceId: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildRegistrationConfirmationHtml(
  data: RegistrationEmailData,
): string {
  const fullName = escapeHtml(data.fullName);
  const eventName = escapeHtml(data.eventName);
  const ticketCategoryName = escapeHtml(data.ticketCategoryName);

  const dateStart = new Date(data.eventDateStart);
  const dateEnd = new Date(data.eventDateEnd);

  const TZ = 'Asia/Manila';

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', {
      timeZone: TZ,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', {
      timeZone: TZ,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const shortMonth = dateStart
    .toLocaleDateString('en-US', { timeZone: TZ, month: 'short' })
    .toUpperCase();
  const dayNum = Number(
    dateStart.toLocaleDateString('en-US', { timeZone: TZ, day: 'numeric' }),
  );

  const startDateStr = dateStart.toLocaleDateString('en-US', { timeZone: TZ });
  const endDateStr = dateEnd.toLocaleDateString('en-US', { timeZone: TZ });
  const isSameDay = startDateStr === endDateStr;
  const dateDisplay = isSameDay
    ? formatDate(dateStart)
    : `${formatDate(dateStart)} - ${formatDate(dateEnd)}`;
  const timeDisplay = `${formatTime(dateStart)} - ${formatTime(dateEnd)}`;

  const refId = escapeHtml(data.referenceId.slice(-8).toUpperCase());

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Registration Confirmed - ${eventName}</title>
  <!--[if mso]>
  <style>table,td,th{font-family:Arial,sans-serif!important}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Your registration for ${eventName} is confirmed. Ref: ${refId} &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.04);">

                <!-- Hero Header -->
                <tr>
                  <td style="background:linear-gradient(180deg,#2563EB 0%,#153885 100%);padding:40px 40px 36px;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-bottom:16px;">
                      <tr>
                        <td style="width:56px;height:56px;border-radius:50%;background-color:rgba(255,255,255,0.15);text-align:center;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:28px;line-height:56px;">&#10003;</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;line-height:1.2;">You're Registered!</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:15px;font-weight:400;line-height:1.5;">Your spot has been secured</p>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding:32px 40px 0;">
                    <p style="margin:0;color:#1E293B;font-size:16px;line-height:1.7;">
                      Hi <strong style="color:#0f172a;">${fullName}</strong>,
                    </p>
                    <p style="margin:10px 0 0;color:#64748B;font-size:15px;line-height:1.7;">
                      You have successfully registered for the event below. Here are your details for reference.
                    </p>
                  </td>
                </tr>

                <!-- Event Details Card -->
                <tr>
                  <td style="padding:24px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">

                      <!-- Event Name + Date Badge -->
                      <tr>
                        <td style="padding:22px 22px 18px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:52px;vertical-align:top;">
                                <table role="presentation" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
                                  <tr>
                                    <td style="background-color:#2563EB;padding:3px 12px;text-align:center;">
                                      <span style="color:#ffffff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">${shortMonth}</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="background-color:#ffffff;padding:3px 12px;text-align:center;">
                                      <span style="color:#0f172a;font-size:20px;font-weight:800;line-height:1.2;">${dayNum}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="padding-left:14px;vertical-align:top;">
                                <p style="margin:0;color:#0f172a;font-size:17px;font-weight:700;line-height:1.3;">${eventName}</p>
                                <p style="margin:4px 0 0;color:#64748B;font-size:13px;line-height:1.4;">${dateDisplay}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr>
                        <td style="padding:0 22px;">
                          <div style="height:1px;background-color:#e2e8f0;"></div>
                        </td>
                      </tr>

                      <!-- Detail Rows with Icons -->
                      <tr>
                        <td style="padding:18px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                            <!-- Time -->
                            <tr>
                              <td style="padding:0 0 14px;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width:28px;vertical-align:top;padding-top:1px;">
                                      <span style="font-size:15px;">&#128339;</span>
                                    </td>
                                    <td style="vertical-align:top;">
                                      <p style="margin:0;color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Time</p>
                                      <p style="margin:3px 0 0;color:#1E293B;font-size:14px;font-weight:500;">${timeDisplay}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>

                            <!-- Ticket Type -->
                            <tr>
                              <td style="padding:0 0 14px;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width:28px;vertical-align:top;padding-top:1px;">
                                      <span style="font-size:15px;">&#127915;</span>
                                    </td>
                                    <td style="vertical-align:top;">
                                      <p style="margin:0;color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Ticket Type</p>
                                      <p style="margin:3px 0 0;color:#1E293B;font-size:14px;font-weight:500;">${ticketCategoryName}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>

                            <!-- Registered To -->
                            <tr>
                              <td style="padding:0;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width:28px;vertical-align:top;padding-top:1px;">
                                      <span style="font-size:15px;">&#128100;</span>
                                    </td>
                                    <td style="vertical-align:top;">
                                      <p style="margin:0;color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Registered To</p>
                                      <p style="margin:3px 0 0;color:#1E293B;font-size:14px;font-weight:500;">${fullName}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>

                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Reference ID Strip -->
                <tr>
                  <td style="padding:0 40px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;border-radius:8px;border:1px solid #dbeafe;">
                      <tr>
                        <td style="padding:14px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:middle;">
                                <p style="margin:0;color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Reference ID</p>
                              </td>
                              <td style="vertical-align:middle;text-align:right;">
                                <p style="margin:0;color:#2563EB;font-size:16px;font-weight:700;font-family:'Courier New',Courier,monospace;letter-spacing:2px;">${refId}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Callout -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border-radius:8px;border-left:3px solid #2563EB;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;color:#1e40af;font-size:13px;font-weight:500;line-height:1.6;">
                            No further action is needed - just show up and enjoy the event!
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                    <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.5;">
                      This is an automated message from AdTO. Please do not reply to this email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}
