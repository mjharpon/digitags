// Email HTML de bienvenue envoyé au freelance après son inscription
// (/api/candidature → Resend). Template validé par MJ le 21 oct. 2026.
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export function emailBienvenue(prenom: string, job: string): string {
  const p = esc(prenom);
  const j = esc(job);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bienvenue dans le Hub</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f3ee;">
<!-- Aperçu : les variables ${p}, ${j} seront remplies à l'envoi -->
<div style="display:none;max-height:0;overflow:hidden;">Votre profil est bien enregistré — nous scrutons les opportunités pour vous.</div>
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
            Le hub des talents digitaux
          </td>
        </tr>
      </table>
      <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:28px;line-height:1.25;font-weight:800;color:#ffffff;padding-top:28px;">
        Bienvenue dans le Hub,<br>${p}&nbsp;👋
      </div>
      <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#b9c0d8;padding-top:12px;">
        Votre profil <strong style="color:#f5b731;">${j}</strong> est bien enregistré dans notre réseau de plus de 1&nbsp;600 experts freelances.
      </div>
    </td></tr>

    <!-- Corps -->
    <tr><td style="background-color:#ffffff;padding:36px 40px;">
      <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:800;color:#111c3f;padding-bottom:18px;">
        Ce qui se passe maintenant
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="36" valign="top" style="padding-bottom:18px;">
            <div style="width:26px;height:26px;border-radius:50%;background-color:#2b46f0;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;line-height:26px;">1</div>
          </td>
          <td valign="top" style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3d4461;padding-bottom:18px;">
            <strong style="color:#111c3f;">Votre profil rejoint le réseau.</strong><br>
            L'équipe digitags prend connaissance de votre parcours, de votre TJM et de vos préférences.
          </td>
        </tr>
        <tr>
          <td width="36" valign="top" style="padding-bottom:18px;">
            <div style="width:26px;height:26px;border-radius:50%;background-color:#f5b731;color:#111c3f;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;line-height:26px;">2</div>
          </td>
          <td valign="top" style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3d4461;padding-bottom:18px;">
            <strong style="color:#111c3f;">Nous scrutons les opportunités pour vous.</strong><br>
            Chaque brief client est confronté aux profils du réseau : métier, séniorité, disponibilité, rythme.
          </td>
        </tr>
        <tr>
          <td width="36" valign="top">
            <div style="width:26px;height:26px;border-radius:50%;background-color:#f2543d;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;line-height:26px;">3</div>
          </td>
          <td valign="top" style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3d4461;">
            <strong style="color:#111c3f;">On vous contacte dès que nous détectons une opportunité pour vous.</strong><br>
            Pas de spam, pas d'appels d'offres à rallonge : uniquement des missions qualifiées qui correspondent à votre profil.
          </td>
        </tr>
      </table>

      <!-- Encart confidentialité -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
        <tr><td style="background-color:#eef1fb;border-radius:12px;padding:18px 22px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#3d4461;">
          🔒 <strong style="color:#111c3f;">Vos données restent privées.</strong> Seule l'équipe digitags accède à votre fiche ; les clients ne voient qu'un profil anonymisé, et seulement si vous l'avez accepté. Suppression sur simple demande à <a href="mailto:hello@digitags.work" style="color:#2b46f0;font-weight:700;text-decoration:none;">hello@digitags.work</a>.
        </td></tr>
      </table>

      <!-- CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px auto 6px;">
        <tr><td style="background-color:#111c3f;border-radius:10px;">
          <a href="https://digitags.work" style="display:inline-block;padding:14px 30px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
            Découvrir le Hub&nbsp;→
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
            Une question&nbsp;? Répondez simplement à cet email.
          </td>
          <td align="right" style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;">
            <a href="https://www.linkedin.com/company/18871359" style="color:#2b46f0;font-weight:700;text-decoration:none;">LinkedIn</a>
            &nbsp;·&nbsp;
            <a href="https://digitags.work/politique-de-protection-des-donnees" style="color:#8b8f9f;text-decoration:none;">Données personnelles</a>
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
