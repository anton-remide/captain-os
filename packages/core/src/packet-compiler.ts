import type { ClassificationArtifact, LabInput, PacketPreviewArtifact } from './schema'

function sourceLabel(input: LabInput): string[] {
  return [...new Set([...(input.sourceDocs ?? []), input.sourceCase].filter(Boolean) as string[])]
}

export function compilePacketPreview(input: LabInput, classification: ClassificationArtifact): PacketPreviewArtifact {
  const allowedScope = ['read repository/process docs', 'produce shadow lab artifacts', 'record advisory blocks']
  const forbiddenScope = [
    'production runtime edits',
    'repair-ledger mutation from shadow run',
    'GitHub/Notion writes',
    'auto-dispatching agents',
    'final accepted_full claim without implementation evidence',
  ]
  const contextNeeds = ['current user intent', 'relevant Captain OS Lab policy docs']
  const blastRadiusNeeds = ['affected surfaces/contracts', 'forbidden scope', 'acceptance object']
  const acceptanceObjects = ['classification.json', 'packet-preview.json', 'crew-plan.json', 'evidence-matrix.json']
  const evidencePlan = ['typed artifact output', 'missing evidence rows', 'StarPom final-claim verdict']
  const stopConditions = ['unsafe output path', 'unsupported mode', 'required evidence missing for final claim']

  if (classification.intentMode === 'copy_exact') {
    allowedScope.push('adapt only named data/content from source to target')
    forbiddenScope.push('new layout', 'new components', 'new controls', 'unapproved copy', 'creative redesign')
    contextNeeds.push('source object', 'target object', 'allowed differences', 'forbidden differences')
    acceptanceObjects.push(
      input.context.sourceObject ?? 'source object',
      input.context.targetObject ?? 'target object',
      'source -> target copy map',
      'golden comparison',
    )
    evidencePlan.push('copy-map.json', 'golden screenshot/code/data comparison', 'deviation log')
    stopConditions.push('source-target map absent')
  }

  if (classification.intentMode === 'preserve_and_repair') {
    contextNeeds.push('accepted baseline', 'preserved behavior list', 'repaired behavior list')
    acceptanceObjects.push('before/after behavior', 'regression proof')
    evidencePlan.push('baseline map', 'rerun after fix')
    stopConditions.push('accepted baseline unknown')
  }

  if (classification.intentMode === 'system_refactor') {
    contextNeeds.push('radius map', 'contract map', 'migration/rollback story')
    blastRadiusNeeds.push('shared runtime contracts', 'standardization path')
    evidencePlan.push('radius-map.json', 'contract-map.json', 'compatibility proof')
    stopConditions.push('radius map absent')
  }

  if (classification.intentMode === 'incident_repair') {
    contextNeeds.push('failed gate', 'root invariant', 'recurrence guard')
    acceptanceObjects.push('repair artifact', 'fixture/guard', 'retest evidence')
    evidencePlan.push('incident.json', 'repair-map.json', 'fixture-plan.json')
    stopConditions.push('same failure can recur after closeout')
  }

  if (classification.finalClaimGateRequired) {
    evidencePlan.push('final claim evidence bound to accepted object')
    stopConditions.push('final claim attempted while StarPom blocks')
  }

  return {
    goal: input.task,
    allowedScope,
    forbiddenScope,
    sourceOfTruth: sourceLabel(input),
    contextNeeds: [...new Set(contextNeeds)],
    blastRadiusNeeds: [...new Set(blastRadiusNeeds)],
    acceptanceObjects: [...new Set(acceptanceObjects)],
    evidencePlan: [...new Set(evidencePlan)],
    stopConditions: [...new Set(stopConditions)],
  }
}

