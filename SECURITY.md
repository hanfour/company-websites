# Security Guidelines

## 🔐 Credentials Management

### DO ✅

1. **Store credentials in `.env.local` files**
   - These files are gitignored and never committed
   - Use `.env.example` as a template

2. **Use environment variables in production**
   - Vercel: Set in Project Settings → Environment Variables
   - Never hardcode credentials in code

3. **Rotate credentials regularly**
   - AWS Access Keys: Every 90 days
   - Session secrets: Every 180 days
   - Admin passwords: As needed

4. **Use strong secrets**
   ```bash
   # Generate session secret
   openssl rand -base64 32

   # Hash admin password
   npx bcryptjs yourpassword 10
   ```

### DON'T ❌

1. **NEVER commit credentials to Git**
   - Not in code
   - Not in comments
   - Not in documentation
   - Not even in examples

2. **NEVER share credentials**
   - Use password managers
   - Share securely (encrypted channels)
   - Revoke after use if shared temporarily

3. **NEVER use real credentials in documentation**
   - Always use placeholders like `your-key-here`
   - Examples: `AKIA...`, `your-secret-key`, etc.

## 🚨 If Credentials Are Exposed

### Immediate Actions

1. **Revoke the exposed credentials**
   - AWS: IAM Console → Users → Security Credentials → Delete Access Key
   - Vercel: Project Settings → Environment Variables → Regenerate

2. **Generate new credentials**
   - Create new access keys/secrets
   - Update `.env.local` locally
   - Update environment variables in production

3. **Audit access logs**
   - AWS CloudTrail: Check for unauthorized access
   - Review recent API calls

4. **Notify team members**
   - Inform stakeholders about the exposure
   - Document incident and response

### Prevention

- Enable GitHub Secret Scanning (already enabled)
- Use pre-commit hooks to scan for secrets
- Regular security audits
- Follow principle of least privilege

## 📋 Sensitive Files Checklist

Files that should NEVER be committed:

- `.env`, `.env.local`, `.env.*.local`
- `user.json` (contains password hashes)
- `*.bak`, `*.backup`
- AWS credentials files
- Private keys (`.pem`, `.key`)
- SSL certificates
- Database dumps

All these are covered in `.gitignore`.

## 🛡️ Security Best Practices

### AWS

1. **IAM User Permissions**
   - Only grant necessary permissions
   - Use custom policies, not `AdministratorAccess`
   - Enable MFA for console access

2. **S3 Security**
   - Use bucket policies to restrict access
   - Enable versioning to recover from accidents
   - Enable server-side encryption

### Application

1. **Authentication**
   - Use bcrypt for password hashing (cost factor ≥ 10)
   - Implement rate limiting on login endpoints
   - Use secure session management

2. **API Security**
   - Validate all inputs
   - Use CORS appropriately
   - Implement CSRF protection for state-changing operations

3. **Dependencies**
   - Regularly update dependencies (`npm audit`)
   - Review security advisories
   - Use `npm audit fix` for automated fixes

## 📞 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [your-security-email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist#security)
