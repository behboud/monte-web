# Email Configuration for Contact Form 7

## Current Status

The Contact Form 7 is fully configured and functional for form validation and submission. However, **email delivery is not configured in the development environment**.

## Development Environment

The Docker WordPress container does not have a mail transfer agent (MTA) configured. This is normal for development environments.

### Error Message
```
sh: 1: /usr/sbin/sendmail: not found
```

## Production Setup Required

For the production environment, you must configure one of the following:

### Option 1: WP Mail SMTP Plugin (Recommended)

1. Install and activate the "WP Mail SMTP" plugin
2. Configure with your email provider:
   - Gmail SMTP
   - SendGrid
   - Mailgun
   - Amazon SES
   - Or any custom SMTP server

### Option 2: Server Sendmail Configuration

Configure the server's sendmail or postfix to send emails directly.

### Option 3: Install Mail Transfer Agent in Docker

Add to `Dockerfile.wordpress`:
```dockerfile
RUN apt-get update && apt-get install -y \
    msmtp \
    msmtp-mta \
    mailutils
```

Then configure msmtp with proper SMTP settings.

## Contact Form Details

- **Form ID**: 258
- **Recipient**: verwaltung@montessorischule-gilching.de
- **Subject**: Kontaktanfrage von der Website - [your-name]
- **Reply-To**: [your-email]

## Testing Email Delivery

Once SMTP is configured in production, test with:

```bash
wp eval "wp_mail('test@example.com', 'Test Subject', 'Test Message');" --allow-root
```

Or use the Contact Form 7 form submission on the /kontakt/ page.

## Form Validation

✅ Form validation is working correctly:
- Required field validation
- Email format validation
- Phone number format validation
- German error messages

## Next Steps for Production

1. Choose an email delivery method (WP Mail SMTP recommended)
2. Configure SMTP credentials
3. Test email delivery
4. Update recipient email if needed
5. Configure SPF/DKIM records for the domain
