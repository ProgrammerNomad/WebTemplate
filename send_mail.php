<?php
/**
 * send_mail.php — ZeptoMail SMTP handler
 *
 * Requires PHPMailer. Install via Composer:
 *   composer require phpmailer/phpmailer
 *
 * ZeptoMail SMTP settings:
 *   Host : smtp.zeptomail.com  (use smtp.zeptomail.in for Indian data center)
 *   Port : 587  (STARTTLS)
 *   User : emailapikey          ← literal string, not your email
 *   Pass : Your ZeptoMail Send-Mail token (from ZeptoMail dashboard)
 */

/* ─── Configuration ──────────────────────────────── */
const SMTP_HOST     = 'smtp.zeptomail.com';
const SMTP_PORT     = 587;
const SMTP_USER     = 'emailapikey';
const SMTP_PASS     = 'YOUR_ZEPTOMAIL_TOKEN_HERE';   // ← replace
const MAIL_FROM     = 'no-reply@yourdomain.com';      // ← verified sender in ZeptoMail
const MAIL_FROM_NAME = 'NexaCode Website';
const MAIL_TO       = 'hello@yourdomain.com';         // ← where you receive enquiries
const ALLOWED_ORIGIN = '';   // e.g. 'https://yourdomain.com' — leave empty to skip CORS check

/* ─── Bootstrap ──────────────────────────────────── */
header('Content-Type: application/json');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['ok' => false, 'error' => 'Method not allowed.']));
}

// Optional: restrict to your own origin
if (ALLOWED_ORIGIN !== '') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== ALLOWED_ORIGIN) {
        http_response_code(403);
        exit(json_encode(['ok' => false, 'error' => 'Forbidden.']));
    }
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
}

// Require PHPMailer (installed by Composer)
$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) {
    http_response_code(500);
    exit(json_encode([
        'ok'    => false,
        'error' => 'Mailer not configured. Run: composer require phpmailer/phpmailer',
    ]));
}
require $autoload;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

/* ─── Input validation ───────────────────────────── */
$allowed_services = [
    '', 'Web Development', 'Mobile App', 'UI/UX Design',
    'AI Integration', 'Cloud & DevOps', 'E-Commerce',
];

$name    = trim(strip_tags($_POST['name']    ?? ''));
$email   = trim($_POST['email']   ?? '');
$service = trim($_POST['service'] ?? '');
$budget  = trim($_POST['budget']  ?? '');
$message = trim(strip_tags($_POST['message'] ?? ''));

$errors = [];

if ($name === '' || mb_strlen($name) > 120) {
    $errors[] = 'Name is required (max 120 characters).';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 254) {
    $errors[] = 'A valid email address is required.';
}
if (!in_array($service, $allowed_services, true)) {
    $errors[] = 'Invalid service selection.';
}
if ($message === '' || mb_strlen($message) > 4000) {
    $errors[] = 'Message is required (max 4000 characters).';
}

if (!empty($errors)) {
    http_response_code(422);
    exit(json_encode(['ok' => false, 'error' => implode(' ', $errors)]));
}

/* ─── Build email body ───────────────────────────── */
$serviceLabel = $service !== '' ? htmlspecialchars($service) : 'Not specified';
$budgetLabel  = $budget  !== '' ? htmlspecialchars($budget)  : 'Not specified';

$htmlBody = "
<!DOCTYPE html>
<html>
<head><meta charset='UTF-8'></head>
<body style='font-family:Arial,sans-serif;color:#222;background:#f4f4f4;margin:0;padding:20px'>
  <div style='max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0'>
    <div style='background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px'>
      <h1 style='color:#fff;margin:0;font-size:20px'>New Project Enquiry</h1>
      <p style='color:rgba(255,255,255,.8);margin:6px 0 0;font-size:14px'>Received via NexaCode website</p>
    </div>
    <div style='padding:32px'>
      <table style='width:100%;border-collapse:collapse'>
        <tr><td style='padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600;width:120px;color:#555;font-size:14px'>Name</td>
            <td style='padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px'>" . htmlspecialchars($name) . "</td></tr>
        <tr><td style='padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#555;font-size:14px'>Email</td>
            <td style='padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px'><a href='mailto:" . htmlspecialchars($email) . "' style='color:#6366f1'>" . htmlspecialchars($email) . "</a></td></tr>
        <tr><td style='padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#555;font-size:14px'>Service</td>
            <td style='padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px'>$serviceLabel</td></tr>
        <tr><td style='padding:10px 0;font-weight:600;color:#555;font-size:14px'>Budget</td>
            <td style='padding:10px 0;font-size:14px'>$budgetLabel</td></tr>
      </table>
      <div style='margin-top:24px'>
        <p style='font-weight:600;color:#555;font-size:14px;margin:0 0 10px'>Message</p>
        <div style='background:#f8f9fa;border-radius:6px;padding:16px;font-size:14px;line-height:1.7;white-space:pre-wrap'>" . htmlspecialchars($message) . "</div>
      </div>
    </div>
    <div style='background:#f8f9fa;padding:16px 32px;font-size:12px;color:#999;border-top:1px solid #e0e0e0'>
      Sent from NexaCode contact form &bull; " . date('d M Y H:i') . " UTC
    </div>
  </div>
</body>
</html>";

$textBody = "New Project Enquiry\n"
    . "===================\n"
    . "Name    : $name\n"
    . "Email   : $email\n"
    . "Service : $serviceLabel\n"
    . "Budget  : $budgetLabel\n\n"
    . "Message:\n$message\n";

/* ─── Send via ZeptoMail SMTP ────────────────────── */
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host        = SMTP_HOST;
    $mail->SMTPAuth    = true;
    $mail->Username    = SMTP_USER;
    $mail->Password    = SMTP_PASS;
    $mail->SMTPSecure  = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port        = SMTP_PORT;
    $mail->CharSet     = 'UTF-8';

    $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
    $mail->addAddress(MAIL_TO);
    $mail->addReplyTo($email, $name);

    $mail->isHTML(true);
    $mail->Subject = "New enquiry from $name — NexaCode";
    $mail->Body    = $htmlBody;
    $mail->AltBody = $textBody;

    $mail->send();
    exit(json_encode(['ok' => true]));

} catch (Exception $e) {
    http_response_code(500);
    // Do NOT expose $mail->ErrorInfo to the client (may contain credentials)
    error_log('Mailer error: ' . $mail->ErrorInfo);
    exit(json_encode(['ok' => false, 'error' => 'Could not send message. Please try again later.']));
}
