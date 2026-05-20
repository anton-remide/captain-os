import { getPolicy } from './policy-registry'
import type {
  ClassificationArtifact,
  EvidenceMatrixArtifact,
  EvidenceRow,
  FixFinding,
  FixQueueArtifact,
  LabInput,
  PacketPreviewArtifact,
} from './schema'

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function derivedBlocks(input: LabInput, classification: ClassificationArtifact): string[] {
  const blocks: string[] = []

  if (classification.intentMode === 'copy_exact') {
    blocks.push('missing_source_target_map', 'missing_golden_comparison')
    if (!input.context.userInspectionObject) blocks.push('acceptance_object_mismatch_risk')
  }

  if (classification.intentMode === 'preserve_and_repair') {
    if (!input.context.acceptedBaseline) blocks.push('missing_prior_interaction_baseline')
    if (classification.finalClaimGateRequired) blocks.push('missing_regression_proof')
  }

  if (classification.intentMode === 'system_refactor' && !input.context.radiusArtifact) {
    blocks.push('missing_context_radius_artifact')
  }

  if (classification.finalClaimGateRequired && !input.context.finalClaimEvidence) {
    blocks.push('missing_final_claim_evidence')
  }

  return blocks
}

export function buildEvidenceMatrix(
  input: LabInput,
  classification: ClassificationArtifact,
  packetPreview: PacketPreviewArtifact,
  runtimeBlocks: string[] = [],
): { evidenceMatrix: EvidenceMatrixArtifact; fixQueue: FixQueueArtifact } {
  const expectedBlocks = input.expected?.requiredBlocks ?? []
  const blockIds = unique([...expectedBlocks, ...runtimeBlocks, ...derivedBlocks(input, classification)])
  const rows: EvidenceRow[] = []

  for (const blockId of blockIds) {
    const policy = getPolicy(blockId)
    rows.push({
      id: policy.id,
      claimId: policy.id,
      claimType: blockId.includes('diamond') || blockId.includes('research')
        ? 'research'
        : blockId.includes('checklist')
          ? 'checklist'
          : blockId.includes('accepted_risk')
            ? 'accepted_risk'
            : blockId.includes('execution_plan')
              ? 'execution_plan'
              : blockId.includes('starpom')
                ? 'starpom_closeout'
                : blockId.includes('sailor')
                  ? 'sailor_output'
                  : 'artifact_spec',
      claim: policy.claim,
      owner: policy.owner,
      priority: policy.priority,
      userInspectionObject: input.context.userInspectionObject ?? input.context.acceptanceObject ?? null,
      agentAcceptanceObject: input.context.agentAcceptanceObject ?? input.context.acceptanceObject ?? null,
      acceptanceObjectMatch: input.context.agentAcceptanceObject && input.context.userInspectionObject
        ? input.context.agentAcceptanceObject === input.context.userInspectionObject
        : null,
      changedScope: input.context.changedScope ? input.context.changedScope.split(',').map((item) => item.trim()) : [],
      requiredEvidence: policy.requiredEvidence,
      evidenceRefs: [],
      freshness: null,
      negativeProof: blockId.includes('negative') || blockId.includes('security') ? null : 'not_required',
      rerunStatus: blockId.includes('rerun') ? 'required' : 'not_required',
      verdict: 'blocked',
      blocking: policy.priority === 'P0' || policy.priority === 'P1',
      missingEvidence: policy.requiredEvidence,
      source: policy.source,
      status: 'open',
    })
  }

  const warningRows = input.expected?.nonBlockingWarnings?.map((warning): EvidenceRow => {
    const policy = getPolicy(warning)
    return {
      id: warning,
      claimId: warning,
      claimType: 'artifact_spec',
      claim: policy.claim,
      owner: policy.owner,
      priority: 'P2',
      userInspectionObject: input.context.userInspectionObject ?? input.context.acceptanceObject ?? null,
      agentAcceptanceObject: input.context.agentAcceptanceObject ?? input.context.acceptanceObject ?? null,
      acceptanceObjectMatch: null,
      changedScope: [],
      requiredEvidence: policy.requiredEvidence,
      evidenceRefs: [],
      freshness: null,
      negativeProof: 'not_required',
      rerunStatus: 'not_required',
      verdict: 'warning',
      blocking: false,
      missingEvidence: policy.requiredEvidence,
      source: policy.source,
      status: 'warning',
    }
  }) ?? []

  rows.push(...warningRows)

  if (rows.length === 0) {
    rows.push({
      id: 'shadow_artifacts_written',
      claimId: 'shadow_artifacts_written',
      claimType: 'classification',
      claim: 'low-risk shadow run writes typed artifacts only',
      owner: 'QA',
      priority: 'P2',
      userInspectionObject: input.context.userInspectionObject ?? null,
      agentAcceptanceObject: input.context.agentAcceptanceObject ?? null,
      acceptanceObjectMatch: null,
      changedScope: [],
      requiredEvidence: ['run.json', 'captain-synthesis.md'],
      evidenceRefs: ['run.json', 'captain-synthesis.md'],
      freshness: 'current',
      negativeProof: 'not_required',
      rerunStatus: 'not_required',
      verdict: 'pass',
      blocking: false,
      missingEvidence: [],
      source: '18-implementation-spec-shadow-runner-v0.md',
      status: 'closed',
    })
  }

  const blockingRows = rows.filter((row) => row.blocking && row.verdict === 'blocked')
  const missingEvidence = unique(blockingRows.flatMap((row) => [row.id, ...row.missingEvidence]))
  const acceptanceObjectMismatches = rows
    .filter((row) => row.id.includes('acceptance_object') || row.id.includes('source_target'))
    .map((row) => row.id)

  const findings: FixFinding[] = blockingRows.map((row) => ({
    id: row.id,
    claim: row.claim,
    owner: row.owner,
    severity: row.priority,
    status: 'open',
    evidenceRequired: row.requiredEvidence,
    rerunRequired: true,
    trackingLink: null,
    closureReason: null,
  }))

  return {
    evidenceMatrix: {
      claims: unique([
        classification.intentMode,
        classification.complexityTier,
        classification.planDepth,
        ...packetPreview.acceptanceObjects,
      ]),
      rows,
      missingEvidence,
      staleEvidence: [],
      acceptanceObjectMismatches,
      finalVerdict: blockingRows.length > 0 ? 'blocked' : warningRows.length > 0 ? 'warning' : 'pass',
    },
    fixQueue: {
      findings,
    },
  }
}
