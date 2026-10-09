# Direct pull request workflow smoke test

Date: 2026-10-09 (Asia/Bangkok)

This document is a small, documentation-only change used to verify that
`Kainapat-manage-course` can open a pull request directly into `main`.

## History integration

The branches originally had unrelated Git histories. A merge on
`Kainapat-manage-course` connects both histories while retaining the application
snapshot and the two Production documents already present on `main`.
Before adding this test document, the integrated Git tree was verified to match
`origin/main` exactly.

## Expected review

- Pull request base: `main`.
- Pull request head: `Kainapat-manage-course`.
- File diff: only this document, provided `main` has not changed meanwhile.
- Application behavior: unchanged by this test document.

Creating or merging this documentation change does not establish Production
readiness. Follow the [remediation plan](superpowers/plans/2026-10-09-production-readiness-remediation.md)
and [deployment guide](deployment/UNIVERSITY_PRODUCTION_DEPLOYMENT.md) before release.

## Future changes

Keep the shared Git history intact. Update `Kainapat-manage-course` from `main`
before starting work, commit the intended changes on `Kainapat-manage-course`,
and open a pull request with `main` as its base.
