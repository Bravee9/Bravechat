# Security Policy

## Supported Versions

Security updates and vulnerability patches are actively delivered for the following version tracks:

| Version Track | Supported |
| :--- | :--- |
| `1.x` (dev / main) | Yes |
| `< 1.0.0` | Critical security fixes only |

---

## Reporting a Vulnerability

The Bravechat engineering team prioritizes system security, user privacy, and defensive architecture.

If you identify a security vulnerability in Bravechat, please report it privately:

1. Submit details through GitHub Security Advisories at `https://github.com/Bravee9/Bravechat/security/advisories/new`.
2. Alternatively, contact the project maintainers directly via repository security contacts.

Please include the following information in your advisory:
- Identification of the affected package or endpoint (`apps/api`, `apps/web`, `packages/shared`, or container configurations).
- Step-by-step reproduction instructions, payload samples, or proof-of-concept scripts.
- Assessment of potential impact (e.g. privilege escalation, token disclosure, unauthorized access, or denial of service).

### Response Timeline
- An initial acknowledgment will be provided within 48 hours.
- A status assessment and remediation timeframe will be communicated within 5 business days.
- Security fixes will be released as high-priority hotfix patches to `main`.
