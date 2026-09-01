# Safety, Privacy, and Human Control

PathwayOS treats the student as the final decision-maker.

## Read versus write behavior

Read and reasoning tools can inspect the demo profile, degree requirements, courses, the attached career JSON, and curated detailed opportunities. They can calculate matches and create non-binding simulations.

The following actions are approval-gated:

- replacing the official degree plan
- adding a course to the official plan
- saving an opportunity through an agent action
- expressing research interest
- changing scholarship or internship application status

A write tool returns `awaiting_student_confirmation` and an approval identifier. It does not persist the requested change.

## External JSON treatment

The five Career Catalog tools are marked with:

```text
readOnlyHint: true
untrustedContentHint: true
```

PathwayOS treats catalog text and links as data, not executable instructions:

- all rendered text and attributes are escaped
- external links open with `rel="noreferrer"`
- `url: null` remains null and is shown as **Verify**
- missing URLs are never generated or guessed
- the source verification caveat is visible in the UI and tool output
- a malformed/unavailable external file falls back to the last generated validated catalog

The current implementation validates the top-level field structure. Production ingestion should add a complete versioned schema, allowed-protocol checks, size limits, server-side validation, provenance signatures, and moderation/policy review.

## Data minimization

Each tool returns only the fields required for its task. Tool schemas reject unspecified input fields. Opportunity tools never receive unrelated personal information.

## Demo data boundary

The included student, university, organizations, laboratories, and detailed opportunities are synthetic or curated for demonstration. The attached career catalog is hand-curated source data with an explicit verification note. No external form is submitted, no professor is contacted, and no institutional record is changed.

## Production controls

A production deployment should add:

- institution-managed identity and authorization
- per-tool permission checks
- consent records and revocation
- encrypted data at rest and in transit
- retention limits
- immutable audit logging
- independent policy enforcement for agent actions
- input validation on the server, not only in the browser
- source freshness, URL, deadline, and amount verification
- security review of partner feeds and outbound integrations
- content-security policy and protocol allowlisting
- FERPA and institution-specific privacy review where applicable
