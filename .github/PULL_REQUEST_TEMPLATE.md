## Summary

<!-- Describe what changed in Agoge Academy API and why it matters. Keep this concise but useful for reviewers. -->

## Related Issue

<!-- Link the issue this PR closes or references. -->

Closes #

## Type of Change

<!-- Mark every option that applies. -->

- [ ] Bug fix
- [ ] New backend feature
- [ ] API contract change
- [ ] Breaking change
- [ ] Refactor
- [ ] Performance improvement
- [ ] Database/schema change
- [ ] CI/CD or tooling change
- [ ] Documentation update
- [ ] Test update

## Backend Scope

<!-- Identify the Agoge Academy API area affected by this PR. -->

- Area/module:
- Controllers/endpoints:
- Services/providers:
- DTOs/validation:
- Guards/authz:
- Database/ORM:
- Background jobs/queues:
- Observability/logging:

## API Contract

<!-- Fill this out for endpoint or response/request changes. Write "No API contract changes" if not applicable. -->

- Endpoint(s):
- Method(s):
- Request headers/query/body changes:
- Response body/status code changes:
- Error contract changes:
- Versioning/deprecation notes:

## Authentication and Security

<!-- Explain auth/authz impact. Redact secrets and tokens. -->

- [ ] No auth/security impact
- [ ] Authenticated route changed
- [ ] Authorization/role/permission logic changed
- [ ] Sensitive data handling changed
- [ ] Secrets/configuration changed

Notes:

## Database and Data Impact

<!-- Explain migrations, seeds, backfills, indexes, constraints, or data compatibility. -->

- [ ] No database impact
- [ ] Migration included
- [ ] Seed/data fixture changed
- [ ] Backfill required
- [ ] Index/constraint changed
- [ ] Prisma/ORM client generation required

Notes:

## Testing

<!-- Mark what you ran. Prefer exact commands and add short notes for anything skipped. -->

- [ ] `yarn lint`
- [ ] `yarn build`
- [ ] `yarn test --watchman=false --runInBand`
- [ ] `yarn test:e2e --watchman=false --runInBand`
- [ ] `yarn test:cov --watchman=false --runInBand`
- [ ] Manual API testing with curl/Postman/api.http
- [ ] Not applicable

Manual test notes:

```bash
# Paste the key command/request used to verify the behavior.
```

## Review Focus

<!-- Tell reviewers where to spend attention. -->

-

## Compatibility and Rollout

<!-- Explain whether this is safe for existing clients and how it should be deployed. -->

- [ ] Backward compatible
- [ ] Requires API/client coordination
- [ ] Requires environment variable changes
- [ ] Requires migration before deploy
- [ ] Requires feature flag or staged rollout
- [ ] Requires monitoring after deploy

Notes:

## Observability

<!-- Mention logs, metrics, tracing, audit events, or alerts touched by this PR. -->

- [ ] No observability changes
- [ ] Logs added/changed
- [ ] Metrics added/changed
- [ ] Tracing/correlation IDs added/changed
- [ ] Audit/security events added/changed

Notes:

## Checklist

- [ ] I reviewed my own changes before requesting review.
- [ ] I updated or added tests for the changed behavior.
- [ ] I updated docs/examples when API behavior changed.
- [ ] I considered auth, authorization, and sensitive data exposure.
- [ ] I considered database compatibility and rollback safety.
- [ ] I confirmed CI-relevant commands use Yarn, not npm.
- [ ] I did not include secrets, tokens, credentials, or private user data.

## Additional Notes

<!-- Add anything else reviewers should know: tradeoffs, follow-ups, screenshots for docs, or known limitations. -->
