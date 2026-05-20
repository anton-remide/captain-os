import { defaultOperatingSafetyOfficerLanes } from './operating-safety'
import type { ClassificationArtifact, CrewPlanArtifact, LabInput, OperatingSafetyArtifact, Sailor } from './schema'

function add(list: Sailor[], sailor: Sailor): void {
  if (!list.includes(sailor)) list.push(sailor)
}

export function planCrew(
  input: LabInput,
  classification: ClassificationArtifact,
  operatingSafety?: OperatingSafetyArtifact,
): CrewPlanArtifact {
  const required: Sailor[] = ['Captain']
  const optional: Sailor[] = []
  const judgePool: string[] = []
  const subcrewPermissions: string[] = []
  const writeScopes = ['.ship/lab/runs/<run-id> only']
  const forbiddenScopes = [
    'src/**',
    'docs/process/** outside Captain OS Lab fixtures during shadow run',
    '.ship/repair-ledger.json',
    'GitHub/Notion state',
  ]

  if (classification.intentMode === 'copy_exact') {
    add(required, 'Surface')
    add(required, 'QA')
    add(required, 'Context')
    subcrewPermissions.push('1-3 read-only fidelity judges allowed; no creative implementation sailor')
  }

  if (classification.intentMode === 'preserve_and_repair') {
    add(required, 'Context')
    add(required, 'QA')
    subcrewPermissions.push('1-5 read-only repair critics depending on accepted baseline ambiguity')
  }

  if (classification.intentMode === 'system_refactor') {
    add(required, 'Context')
    add(required, 'Runtime')
    add(required, 'QA')
    add(required, 'Shipping')
    add(required, 'Knowledge')
    judgePool.push('architecture judge', 'runtime contract judge', 'blast-radius judge')
    subcrewPermissions.push('3-5 independent scouts/judges before implementation; disjoint write scopes later')
  }

  if (classification.intentMode === 'incident_repair') {
    add(required, 'StarPom')
    add(required, 'QA')
    add(required, 'Context')
    add(required, 'Knowledge')
    add(required, 'Shipping')
    judgePool.push('root-cause judge', 'evidence judge', 'recurrence judge', 'operator-burden judge', 'domain judge')
    subcrewPermissions.push('5-angle failure panel allowed before repair execution')
  }

  if (classification.intentMode === 'strategy_design') {
    add(required, 'Context')
    add(required, 'Knowledge')
    add(required, 'StarPom')
    add(optional, 'JudgePool')
    judgePool.push('principle engineer', 'CTO architect', 'Head of AI', 'AI coding expert', 'process auditor')
    subcrewPermissions.push('judge synthesis allowed; implementation sailors only after accepted issue/spec')
  }

  const text = `${input.task} ${input.tags.join(' ')} ${Object.values(input.context).join(' ')}`.toLowerCase()
  if (/\bcms\b|notion|source|persistence|publish|save|reload|сохран|публикац/.test(text)) add(required, 'CMS')
  if (/public|studio|auth|security|private|protected|bundle|chunk|безопасн/.test(text)) add(required, 'Security')
  if (/\bpr\b|branch|merge|deploy|ci|dirty worktree|ветк/.test(text)) add(required, 'Shipping')
  if (classification.finalClaimGateRequired) add(required, 'StarPom')
  if (classification.hardWorkRequired || classification.octopusRequired) add(required, 'StarPom')
  if (operatingSafety?.blocks.length) add(required, 'StarPom')
  if (operatingSafety?.officerHierarchyRequired) {
    add(required, 'Context')
    add(required, 'QA')
    add(required, 'Knowledge')
    subcrewPermissions.push('Officer hierarchy required before execution because active rows exceed Captain span-of-control')
  }

  if (classification.complexityTier === 'T1' && required.length === 1) {
    add(optional, 'QA')
  }

  const officerLanes = operatingSafety?.officerHierarchyRequired
    ? operatingSafety.officerLanes.length > 0
      ? operatingSafety.officerLanes
      : defaultOperatingSafetyOfficerLanes()
    : []

  return {
    captainMode: classification.captainMode,
    requiredSailors: required,
    optionalSailors: optional.filter((sailor) => !required.includes(sailor)),
    judgePool: [...new Set(judgePool)],
    starpomRequired: required.includes('StarPom') || classification.complexityTier === 'T3' || classification.complexityTier === 'T4',
    officerLanes,
    contextBudget: operatingSafety?.contextBudgetRows ?? [],
    spanOfControlLimit: 5,
    activeChildCount: operatingSafety?.activeRowCount ?? required.length,
    writeScopes,
    forbiddenScopes,
    subcrewPermissions: subcrewPermissions.length > 0
      ? [...new Set(subcrewPermissions)]
      : ['no subcrew needed for low-risk shadow classification'],
    captainOnlyReason: classification.complexityTier === 'T0' || classification.complexityTier === 'T1'
      ? 'Low-risk shadow classification; no real sailor dispatch in v0.'
      : null,
    autoDispatch: false,
  }
}
