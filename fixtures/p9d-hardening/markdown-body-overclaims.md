---
version: 1
id: P9D-MARKDOWN-BODY-OVERCLAIMS
title: Markdown body overclaims while rows remain open
intentMode: bounded_build
complexityTier: T2
planDepth: D2
captainMode: mini_packet
owner: Captain
sourceDocs:
  - docs/process/captain-os-lab/31-p9d-executability-failure-hardening.md
acceptanceObjects:
  - AO-P9D-MARKDOWN
sailors:
  - sailor: Captain
    owns:
      - final wording
    mayDecide:
      - summary wording
    mustNotChange:
      - final claim preflight policy
    mustEscalateIf:
      - body claims done while rows are open
    evidenceOwed:
      - markdown_body_overclaims
  - sailor: Shipping
    owns:
      - next packet mapping
    mayDecide:
      - next action wording
    mustNotChange:
      - row-level continuation policy
    mustEscalateIf:
      - open row lacks next packet
    evidenceOwed:
      - mapped next packet
checklist:
  - id: CHK-P9D-MARKDOWN
    sourceRequirement: Markdown body cannot claim ready while blocking row is open.
    owner: Captain
    scope:
      - docs/process/captain-os-lab/fixtures/p9d-hardening/markdown-body-overclaims.md
    forbiddenScope:
      - final ready wording
    acceptanceObject: AO-P9D-MARKDOWN
    userInspectionObject: Markdown body
    agentAcceptanceObject: Markdown body
    acceptanceObjectMatch: true
    requiredEvidence:
      - closed row evidence
    negativeProofRequired: false
    status: pending
    blocking: true
    evidenceRefs: []
    rerunStatus: required
evidence: []
nextPacket:
  required: true
  owner: Shipping
  nextAction: Close the Markdown body wording row.
  reason: Blocking row remains open.
  artifactRef: docs/process/captain-os-lab/fixtures/p9d-hardening/markdown-body-overclaims.md
  rows:
    - rowId: CHK-P9D-MARKDOWN
      owner: Shipping
      nextAction: Remove final readiness wording or close the row with evidence.
      evidenceOwed:
        - updated Markdown body
      stopCondition: Markdown body no longer overclaims.
      tracking: REPAIR-20260513-CAPTAIN-LIVING-SYSTEM
---

# Result

This is ready and complete.
