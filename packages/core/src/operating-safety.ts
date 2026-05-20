import type {
  ContextBudgetRow,
  LabInput,
  OfficerLane,
  OperatingSafetyArtifact,
  Sailor,
  UserIntentRow,
  VisibleAcceptanceRow,
} from './schema'

const spanOfControlLimit = 5

function bool(value: string | undefined): boolean {
  return /^(true|yes|1)$/i.test(value ?? '')
}

function numberValue(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function splitList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/[;\n|]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function sailorFrom(value: string | undefined, fallback: Sailor): Sailor {
  const normalized = (value ?? '').trim()
  const allowed: Sailor[] = [
    'Captain',
    'StarPom',
    'Context',
    'QA',
    'Surface',
    'CMS',
    'Runtime',
    'Security',
    'Shipping',
    'Knowledge',
    'JudgePool',
  ]
  return allowed.includes(normalized as Sailor) ? normalized as Sailor : fallback
}

function buildUserIntentRows(input: LabInput, missingVisibleObjects: string[]): UserIntentRow[] {
  const explicitRows = splitList(input.context.userIntentRows)
  if (explicitRows.length > 0) {
    return explicitRows.map((row, index) => ({
      id: `USR-${String(index + 1).padStart(3, '0')}`,
      userSaid: row,
      targetSurface: input.context.targetSurface ?? null,
      visibleObject: input.context.visibleObject ?? missingVisibleObjects[index] ?? null,
      requiredChange: input.context.requiredChange ?? row,
      askIfAmbiguous: bool(input.context.askIfAmbiguous),
      status: missingVisibleObjects.length > index ? 'open' : 'closed',
    }))
  }

  return missingVisibleObjects.map((object, index) => ({
    id: `USR-${String(index + 1).padStart(3, '0')}`,
    userSaid: input.task,
    targetSurface: input.context.targetSurface ?? null,
    visibleObject: object,
    requiredChange: input.context.requiredChange ?? `Close visible acceptance for ${object}`,
    askIfAmbiguous: bool(input.context.askIfAmbiguous),
    status: 'open',
  }))
}

function buildVisualRows(input: LabInput, missingVisibleObjects: string[]): VisibleAcceptanceRow[] {
  const closedObjects = splitList(input.context.closedVisibleObjects)
  const allObjects = [...new Set([...splitList(input.context.visibleAcceptanceObjects), ...missingVisibleObjects, ...closedObjects])]
  return allObjects.map((object, index) => ({
    id: `VIS-${String(index + 1).padStart(3, '0')}`,
    visibleObject: object,
    expectedState: input.context.expectedVisibleState ?? 'visible acceptance row closed',
    currentState: missingVisibleObjects.includes(object)
      ? input.context.currentVisibleState ?? 'missing or mismatched'
      : input.context.currentVisibleState ?? null,
    evidenceRequired: ['fresh screenshot or explicit visual proof', 'user-request/result diff'],
    status: missingVisibleObjects.includes(object) ? 'open' : 'closed',
  }))
}

function defaultOfficerLanes(): OfficerLane[] {
  return [
    {
      id: 'intent-scope',
      owner: 'Captain',
      scope: ['user intent rows', 'scope boundaries', 'direct question handling'],
      maxChildren: spanOfControlLimit,
      contextBudgetRefs: ['captain-summary', 'user-intent-rows'],
    },
    {
      id: 'context-rag',
      owner: 'Context',
      scope: ['source docs', 'freshness', 'context radius'],
      maxChildren: spanOfControlLimit,
      contextBudgetRefs: ['source-pack', 'freshness-pack'],
    },
    {
      id: 'domain-surface',
      owner: 'Surface',
      scope: ['visible acceptance objects', 'precedent', 'UI/product inspection surface'],
      maxChildren: spanOfControlLimit,
      contextBudgetRefs: ['visual-pack', 'precedent-pack'],
    },
    {
      id: 'execution',
      owner: 'Runtime',
      scope: ['implementation lanes', 'runtime artifacts', 'fixture execution'],
      maxChildren: spanOfControlLimit,
      contextBudgetRefs: ['execution-pack'],
    },
    {
      id: 'starpom-acceptance',
      owner: 'StarPom',
      scope: ['final claim gate', 'user request diff', 'accepted-risk boundary'],
      maxChildren: spanOfControlLimit,
      contextBudgetRefs: ['acceptance-pack', 'evidence-pack'],
    },
  ]
}

function buildOfficerLanes(input: LabInput): OfficerLane[] {
  const explicit = splitList(input.context.officerLanes)
  if (explicit.length === 0) return []
  return explicit.map((lane, index) => {
    const [ownerText, scopeText] = lane.includes(':') ? lane.split(/:(.+)/) : ['Captain', lane]
    const scopedItems = splitList(scopeText)
    return {
      id: `officer-${index + 1}`,
      owner: sailorFrom(ownerText, 'Captain'),
      scope: scopedItems.length > 0 ? scopedItems : [lane.trim()],
      maxChildren: spanOfControlLimit,
      contextBudgetRefs: [`officer-${index + 1}-budget`],
    }
  })
}

function buildContextBudgetRows(input: LabInput, officerLanes: OfficerLane[], broadcastViolation: boolean): ContextBudgetRow[] {
  const lanes = officerLanes.length > 0 ? officerLanes : defaultOfficerLanes()
  return lanes.map((lane) => ({
    laneId: lane.id,
    owner: lane.owner,
    allowedContext: splitList(input.context.allowedContext).length > 0
      ? splitList(input.context.allowedContext)
      : lane.contextBudgetRefs,
    forbiddenContext: splitList(input.context.forbiddenContext).length > 0
      ? splitList(input.context.forbiddenContext)
      : ['full chat history', 'all docs broadcast', 'unscoped screenshots outside lane'],
    tokenBudgetHint: input.context.tokenBudgetHint ?? 'scoped packet only; no broadcast context',
    violation: broadcastViolation || splitList(input.context.contextBudgetViolations).includes(lane.id),
  }))
}

export function buildOperatingSafety(input: LabInput): OperatingSafetyArtifact {
  const text = `${input.title}\n${input.task}\n${input.tags.join(' ')}\n${Object.values(input.context).join(' ')}`.toLowerCase()
  const directQuestionDetected = bool(input.context.directQuestion) || hasAny(text, [
    /(^|\s)ответь(те)?($|\s|[?!.:,;])/,
    /(^|\s)почему($|\s|[?!.:,;])/,
    /какого\s+х/,
    /что\s+было\s+непонятно/,
    /не\s+понимаешь/,
    /why\s+(did|didn|was|is|are)\b/,
    /what\s+was\s+unclear/,
    /answer\s+(me|first)/,
  ])
  const angerIncidentMode = bool(input.context.angerIncidentMode) || hasAny(text, [
    /болван/,
    /кретин/,
    /долб/,
    /бляд/,
    /проеб/,
    /нахер/,
    /ху[йяе]/,
  ])
  const answerRequiredBeforeAction = directQuestionDetected || angerIncidentMode || bool(input.context.answerRequiredBeforeAction)
  const missingVisibleObjects = splitList(input.context.missingVisibleObjects)
  const testsGreenButVisibleOpen = bool(input.context.testsGreen) && (missingVisibleObjects.length > 0 || bool(input.context.visibleAcceptanceOpen))
  const visualAcceptanceRows = buildVisualRows(input, missingVisibleObjects)
  const userIntentRows = buildUserIntentRows(input, missingVisibleObjects)
  const activeRowCount = numberValue(input.context.activeRowCount) ?? Math.max(userIntentRows.length, visualAcceptanceRows.length)
  const officerLanes = buildOfficerLanes(input)
  const officerHierarchyRequired = activeRowCount > spanOfControlLimit || bool(input.context.officerHierarchyRequired)
  const officerHierarchyPresent = officerLanes.length > 0 || bool(input.context.officerHierarchyPresent)
  const spanOfControlViolation = activeRowCount > spanOfControlLimit && !officerHierarchyPresent
  const broadcastViolation = bool(input.context.broadcastContext) || bool(input.context.contextBroadcast) || splitList(input.context.contextBudgetViolations).length > 0
  const contextBudgetRows = buildContextBudgetRows(input, officerLanes, broadcastViolation)
  const contextBudgetViolations = contextBudgetRows.filter((row) => row.violation).map((row) => row.laneId)
  const requestResultMismatch = bool(input.context.userRequestResultMismatch) ||
    Boolean(input.context.userInspectionObject && input.context.agentAcceptanceObject && input.context.userInspectionObject !== input.context.agentAcceptanceObject)
  const blocks: string[] = []

  if (answerRequiredBeforeAction) blocks.push('stop_and_answer_required')
  if (angerIncidentMode) blocks.push('anger_incident_answer_required')
  if (missingVisibleObjects.length > 0 || testsGreenButVisibleOpen) blocks.push('visible_acceptance_missing')
  if (requestResultMismatch) blocks.push('user_request_result_mismatch')
  if (spanOfControlViolation) blocks.push('span_of_control_violation')
  if (officerHierarchyRequired && !officerHierarchyPresent) blocks.push('officer_hierarchy_missing')
  if (contextBudgetViolations.length > 0) blocks.push('context_budget_violation')

  return {
    directQuestionDetected,
    answerRequiredBeforeAction,
    angerIncidentMode,
    userIntentRows,
    visualAcceptanceRows,
    missingVisibleObjects,
    activeRowCount,
    spanOfControlLimit,
    spanOfControlViolation,
    officerHierarchyRequired,
    officerHierarchyPresent,
    officerLanes: officerHierarchyPresent ? officerLanes : [],
    contextBudgetRows,
    contextBudgetViolations,
    blocks: [...new Set(blocks)],
    nextAction: answerRequiredBeforeAction
      ? 'Answer the direct user question first; no edits, tool calls, or repair execution until the answer exists.'
      : blocks.length > 0
        ? 'Resolve operating-safety blocks before StarPom/final claim.'
        : 'Operating safety has no P0 blocks.',
  }
}

export function defaultOperatingSafetyOfficerLanes(): OfficerLane[] {
  return defaultOfficerLanes()
}
