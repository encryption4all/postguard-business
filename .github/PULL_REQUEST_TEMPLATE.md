<!--
PR titles must follow Conventional Commits (enforced by the "Conventional Commit"
check), e.g. `feat: ...`, `fix: ...`, `docs: ...`, `ci: ...`, `chore: ...`.
-->

## Summary

<!-- What does this PR change, and why? -->

## Related issue

<!-- e.g. Closes #123 -->

## Checklist

- [ ] `npm run lint` and `npm run check` pass
- [ ] Tests added/updated where it makes sense (`npm run test:unit` / `npm run test:e2e`)
- [ ] Database changes ship a migration and pass `npm run db:check` (migration safety)
- [ ] `.env.example` / docs updated if configuration or behaviour changed
