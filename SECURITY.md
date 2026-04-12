# Security Policy

## 🔐 Supported Versions

We actively provide security updates for:

| Version | Supported |
| ------- | --------- |
| 1.x.x   | ✅ Yes    |

Older versions are not guaranteed to receive security updates.

---

## 🚨 Reporting a Vulnerability

We take security seriously.

⚠️ **Do NOT report vulnerabilities via public GitHub issues.**

### 📩 Private Disclosure

Report vulnerabilities through:

- Email: **[aaronulloa.tcp@gmail.com](mailto:aaronulloa.tcp@gmail.com)**
- GitHub Security Advisories (Security tab)

---

## 📋 What to Include

Please provide:

- Description of the vulnerability
- Steps to reproduce
- Affected endpoints or modules
- Potential impact (data exposure, privilege escalation, etc.)
- Suggested fix (optional)
- Your contact information

---

## ⏱️ Response Timeline

| Stage                | Time              |
| -------------------- | ----------------- |
| Initial response     | ≤ 48 hours        |
| Investigation update | ≤ 7 days          |
| Fix release          | Based on severity |

---

## ⚖️ Severity Classification

| Level    | Description                         |
| -------- | ----------------------------------- |
| Critical | Remote code execution, auth bypass  |
| High     | Data exposure, privilege escalation |
| Medium   | Limited data leaks, logic issues    |
| Low      | Minor issues with minimal impact    |

---

## 🛡️ Security Features

This project includes:

- JWT authentication with guards
- Role-based access control (RBAC) via decorators (`@Roles`)
- Protected routes by default (global guards)
- Input validation (`class-validator`)
- Prisma ORM (SQL injection protection)
- Centralized exception handling
- Request-scoped metadata (requestId)
- Rate limiting via `@nestjs/throttler`
- File validation and restrictions in storage module

---

## 🔐 Security Best Practices

When using this project:

### Environment & Secrets

- Never commit `.env` files
- Use strong secrets for JWT
- Rotate credentials regularly

### Authentication

- Use short-lived access tokens
- Implement refresh token rotation
- Always validate user ownership (never trust token blindly)

### Database

- Use strong credentials
- Restrict DB access by IP
- Avoid exposing internal IDs

### File Uploads

- Validate MIME types and size limits
- Avoid storing user-controlled filenames
- Use signed URLs (S3) when possible

### API Security

- Enable rate limiting
- Configure strict CORS
- Use HTTPS in production
- Avoid exposing stack traces

---

## 📦 Dependency Security

- Run:

  ```bash
  npm audit
  ```

- Fix vulnerabilities regularly
- Keep dependencies updated

---

## 🔄 Disclosure Policy

When a vulnerability is reported:

1. We acknowledge receipt within 48 hours
2. We validate and reproduce the issue
3. We prepare and test a fix
4. We release a patched version
5. We publicly disclose after fix is available

---

## ⚠️ Breaking Security Fixes

Critical fixes may:

- Require immediate patch releases
- Introduce breaking changes
- Force API version upgrades

---

## 🙏 Acknowledgements

We appreciate responsible disclosure and thank contributors who help keep this project secure.
