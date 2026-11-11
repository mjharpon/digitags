// Email HTML de bienvenue en anglais, envoyé au freelance inscrit via le
// formulaire /en/become-a-freelancer (champ caché lang=en → /api/candidature).
// Version anglaise du template src/lib/email-bienvenue.ts (mêmes visuels).
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export function emailWelcomeEn(prenom: string, job: string): string {
  const p = esc(prenom);
  const j = esc(job);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to the Hub</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f3ee;">
<!-- Aperçu : les variables ${p}, ${j} seront remplies à l'envoi -->
<div style="display:none;max-height:0;overflow:hidden;">Your profile has been saved — we're scanning opportunities for you.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f3ee;padding:32px 16px;">
<tr><td align="center">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- En-tête navy -->
    <tr><td style="background-color:#111c3f;border-radius:16px 16px 0 0;padding:36px 40px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:800;color:#ffffff;">
            digitags<span style="color:#2b46f0;">.work</span>
          </td>
          <td align="right" style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;color:#8fa0e8;text-transform:uppercase;">
            The digital talent hub
          </td>
        </tr>
      </table>
      <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:28px;line-height:1.25;font-weight:800;color:#ffffff;padding-top:28px;">
        Welcome to the Hub,<br>${p}&nbsp;👋
      </div>
      <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#b9c0d8;padding-top:12px;">
        Your <strong style="color:#f5b731;">${j}</strong> profile has been added to our network of 1,600+ freelance experts.
      </div>
    </td></tr>

    <!-- Corps -->
    <tr><td style="background-color:#ffffff;padding:36px 40px;">
      <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:800;color:#111c3f;padding-bottom:18px;">
        What happens next
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="36" valign="top" style="padding-bottom:18px;">
            <div style="width:26px;height:26px;border-radius:50%;background-color:#2b46f0;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;line-height:26px;">1</div>
          </td>
          <td valign="top" style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3d4461;padding-bottom:18px;">
            <strong style="color:#111c3f;">Your profile joins the network.</strong><br>
            The digitags team reviews your background, your daily rate and your preferences.
          </td>
        </tr>
        <tr>
          <td width="36" valign="top" style="padding-bottom:18px;">
            <div style="width:26px;height:26px;border-radius:50%;background-color:#f5b731;color:#111c3f;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;line-height:26px;">2</div>
          </td>
          <td valign="top" style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3d4461;padding-bottom:18px;">
            <strong style="color:#111c3f;">We scan opportunities for you.</strong><br>
            Every client brief is matched against the network: role, seniority, availability, pace.
          </td>
        </tr>
        <tr>
          <td width="36" valign="top">
            <div style="width:26px;height:26px;border-radius:50%;background-color:#f2543d;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;line-height:26px;">3</div>
          </td>
          <td valign="top" style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3d4461;">
            <strong style="color:#111c3f;">We'll contact you as soon as we detect an opportunity for you.</strong><br>
            No spam, no endless tender lists: only qualified projects that match your profile.
          </td>
        </tr>
      </table>

      <!-- Encart confidentialité -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
        <tr><td style="background-color:#eef1fb;border-radius:12px;padding:18px 22px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#3d4461;">
          🔒 <strong style="color:#111c3f;">Your data stays private.</strong> Only the digitags team can access your file; clients only ever see an anonymised profile, and only if you've agreed. Deleted on request at <a href="mailto:hello@digitags.work" style="color:#2b46f0;font-weight:700;text-decoration:none;">hello@digitags.work</a>.
        </td></tr>
      </table>

      <!-- CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px auto 6px;">
        <tr><td style="background-color:#111c3f;border-radius:10px;">
          <a href="https://digitags.work/en" style="display:inline-block;padding:14px 30px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
            Discover the Hub&nbsp;→
          </a>
        </td></tr>
      </table>
    </td></tr>

    <!-- Pied -->
    <tr><td style="background-color:#ffffff;border-radius:0 0 16px 16px;border-top:1px solid #e9e4dc;padding:24px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8b8f9f;">
            digitags.work — Paris<br>
            A question? Just reply to this email.
          </td>
          <td align="right" style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;">
            <a href="https://www.linkedin.com/company/18871359" style="color:#2b46f0;font-weight:700;text-decoration:none;">LinkedIn</a>
            &nbsp;·&nbsp;
            <a href="https://digitags.work/en/privacy-policy" style="color:#8b8f9f;text-decoration:none;">Personal data</a>
          </td>
        </tr>
      </table>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>
`;
}
