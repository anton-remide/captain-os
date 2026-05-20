import {
  type CaptainMode,
  type ClassificationArtifact,
  type ComplexityTier,
  type IntentMode,
  type LabInput,
  type PlanDepth,
  type RiskScores,
  maxDepth,
  maxTier,
} from './schema'

interface MutableClassification {
  intentMode: IntentMode
  complexityTier: ComplexityTier
  planDepth: PlanDepth
  riskScores: RiskScores
  triggeredRules: string[]
  matchedSignals: string[]
  escalationReason: string
  finalClaimGateRequired: boolean
}

const depthForTier: Record<ComplexityTier, PlanDepth> = {
  T0: 'D0',
  T1: 'D1',
  T2: 'D2',
  T3: 'D3',
  T4: 'D4',
}

function has(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function bump(
  state: MutableClassification,
  tier: ComplexityTier,
  depth: PlanDepth,
  rule: string,
  signal: string,
  risk: keyof RiskScores,
  score: number,
): void {
  state.complexityTier = maxTier(state.complexityTier, tier)
  state.planDepth = maxDepth(state.planDepth, depth)
  state.riskScores[risk] = Math.max(state.riskScores[risk], score)
  state.triggeredRules.push(rule)
  state.matchedSignals.push(signal)
}

function captainModeFor(intentMode: IntentMode, tier: ComplexityTier, hasShipping: boolean): CaptainMode {
  if (intentMode === 'direct_answer' && tier === 'T0') return 'direct_answer'
  if (intentMode === 'incident_repair') return 'incident_repair'
  if (intentMode === 'strategy_design') return 'strategy_packet'
  if (intentMode === 'system_refactor') return 'full_ship_cycle'
  if (hasShipping) return 'bounded_pr'
  if (tier === 'T3' || tier === 'T4') return 'full_ship_cycle'
  return 'mini_packet'
}

export function classifyTask(input: LabInput): ClassificationArtifact {
  const text = `${input.title}\n${input.task}\n${input.tags.join(' ')}\n${Object.values(input.context).join(' ')}`.toLowerCase()
  if (input.tags.includes('control') || input.tags.includes('low_risk')) {
    return {
      intentMode: 'bounded_build',
      complexityTier: 'T1',
      planDepth: 'D1',
      captainMode: 'mini_packet',
      riskScores: {
        userIntent: 1,
        fidelity: 0,
        blastRadius: 0,
        history: 0,
        evidence: 0,
      },
      triggeredRules: ['low_risk_control'],
      matchedSignals: ['fixture/control low-risk signal'],
      escalationReason: 'Low-risk control fixture explicitly checks false-positive behavior.',
      downgradeReason: null,
      hardWorkRequired: false,
      octopusRequired: false,
      finalClaimGateRequired: false,
      confidence: 'high',
    }
  }

  const state: MutableClassification = {
    intentMode: 'direct_answer',
    complexityTier: 'T0',
    planDepth: 'D0',
    riskScores: {
      userIntent: 0,
      fidelity: 0,
      blastRadius: 0,
      history: 0,
      evidence: 0,
    },
    triggeredRules: [],
    matchedSignals: [],
    escalationReason: 'No escalation signals matched.',
    finalClaimGateRequired: false,
  }

  const captainOsAnchorSignal = has(text, [
    /captain os/,
    /\.captain-os/,
    /капитан.*os/,
    /операционн.*систем/,
  ])

  const captainOsAutoBootstrapSignal = (captainOsAnchorSignal && has(text, [
    /task[- ]?spine/,
    /state machine/,
    /session recovery/,
    /continue.*session/,
    /between sessions/,
    /another llm/,
    /other llm/,
    /github.*backlog/,
    /межсессион/,
    /нов(ая|ую).*сесс/,
    /друг(ой|ого).*llm/,
    /восстанов.*контекст/,
    /продолж.*без.*переписк/,
  ])) || input.tags.includes('captain_os_auto_bootstrap')

  if (captainOsAutoBootstrapSignal) {
    state.intentMode = 'system_refactor'
    bump(
      state,
      'T3',
      'D3',
      'captain_os_auto_bootstrap_min_t3',
      'Captain OS continuity/bootstrap prompt',
      'blastRadius',
      4,
    )
  }

  if (input.tags.includes('diamond_protocol') || input.tags.includes('research_to_execution') || input.tags.includes('methodology')) {
    state.intentMode = 'strategy_design'
    bump(state, 'T3', 'D3', 'diamond_protocol_min_d3', 'diamond/research-to-execution methodology signal', 'evidence', 4)
  }

  const copySignal = has(text, [
    /\bcopy\b/,
    /\bone[- ]?to[- ]?one\b/,
    /\bexact(?:ly)?\b/,
    /\bsame as\b/,
    /\bcopy[-_ ]?exact\b/,
    /скопир/,
    /один к одному/,
    /точно как/,
    /как в (entities|ui library|workstation|исходн|примере)/,
  ])

  if (copySignal) {
    state.intentMode = 'copy_exact'
    bump(state, 'T2', 'D2', 'copy_exact_min_t2', 'copy/exact/one-to-one signal', 'fidelity', 3)
  }

  const precedentCopySignal = copySignal && has(text, [
    /workstation/,
    /ui library/,
    /precedent/,
    /canonical/,
    /shell/,
    /канон/,
  ])

  if (precedentCopySignal) {
    bump(state, 'T3', 'D3', 'precedent_copy_min_t3', 'copy_exact against shared precedent signal', 'blastRadius', 4)
  }

  const preserveSignal = has(text, [
    /preserve/,
    /repair/,
    /restore/,
    /regression/,
    /reimport/,
    /сохрани/,
    /почин/,
    /восстанов/,
    /регресс/,
    /потерял/,
    /не ломая/,
  ])

  if (preserveSignal && !copySignal && state.intentMode !== 'strategy_design') {
    state.intentMode = 'preserve_and_repair'
    bump(state, 'T2', 'D2', 'preserve_repair_min_t2', 'preserve/repair/regression signal', 'evidence', 3)
  }

  const acceptedRegressionSignal = preserveSignal && has(text, [
    /accepted baseline/,
    /prior accepted/,
    /accepted behavior/,
    /reading experience/,
    /regression/,
    /baseline/,
    /принят/,
  ])

  if (acceptedRegressionSignal) {
    bump(state, 'T3', 'D3', 'accepted_regression_min_t3', 'prior accepted behavior regression signal', 'history', 4)
  }

  const historySignal = has(text, [
    /зли/,
    /сломал/,
    /сломалось/,
    /фейл/,
    /fail/,
    /again/,
    /caught/,
    /drift/,
    /false[- ]green/,
    /overclaim/,
    /не додел/,
    /снова/,
    /повтор/,
  ])

  if (historySignal) {
    bump(state, 'T2', 'D2', 'history_repeated_drift', 'anger/failure/repeated-drift signal', 'history', 3)
    if (state.intentMode === 'direct_answer' || state.intentMode === 'bounded_build') state.intentMode = 'incident_repair'
  }

  const incidentSignal = has(text, [
    /incident/,
    /root cause/,
    /two[- ]source/,
    /source[- ]of[- ]truth/,
    /security.*overclaim/,
    /public.*overclaim/,
    /review.*overload/,
    /фейлпоинт/,
    /почему.*дрифт/,
  ])

  if (incidentSignal) {
    state.intentMode = 'incident_repair'
    bump(state, 'T3', 'D3', 'incident_repair_min_t3', 'incident/root-cause signal', 'history', 4)
  }

  const publicSecuritySignal = has(text, [
    /public route/,
    /studio\/public/,
    /public.*studio/,
    /auth/,
    /security/,
    /private/,
    /protected/,
    /bundle/,
    /chunk/,
    /production[- ]ready/,
    /доступ/,
    /безопасн/,
  ])

  if (publicSecuritySignal) {
    bump(state, 'T3', 'D3', 'public_security_min_t3', 'public/studio/security signal', 'blastRadius', 4)
    if (state.intentMode === 'direct_answer') state.intentMode = 'preserve_and_repair'
  }

  const cmsSignal = has(text, [
    /\bcms\b/,
    /\bnotion\b/,
    /source/,
    /persistence/,
    /publish/,
    /save/,
    /reload/,
    /reimport/,
    /сохран/,
    /перезагруз/,
    /публикац/,
  ])

  if (cmsSignal) {
    bump(state, 'T2', 'D2', 'cms_source_persistence_min_t2', 'CMS/source/persistence signal', 'evidence', 3)
    if (state.intentMode === 'direct_answer') state.intentMode = 'preserve_and_repair'
  }

  const cmsPersistenceSignal = cmsSignal && has(text, [
    /persistence/,
    /publish/,
    /save/,
    /reload/,
    /fake persistence/,
    /source update/,
    /сохран/,
    /публикац/,
  ])

  if (cmsPersistenceSignal) {
    bump(state, 'T3', 'D3', 'cms_persistence_final_min_t3', 'CMS save/reload/publish persistence signal', 'evidence', 4)
    if (state.intentMode === 'direct_answer') state.intentMode = 'preserve_and_repair'
  }

  const visualEvidenceSignal = has(text, [
    /visual evidence/,
    /rendered visual/,
    /stage visual/,
    /screenshot/,
    /deck/,
    /keynote/,
    /geometry/,
    /визуальн/,
    /скриншот/,
  ])

  if (visualEvidenceSignal) {
    bump(state, 'T2', 'D2', 'visual_evidence_min_t2', 'visual/stage evidence signal', 'evidence', 3)
    if (state.intentMode === 'direct_answer') state.intentMode = 'bounded_build'
  }

  const actualInputModalitySignal = has(text, [
    /input modality/,
    /mac trackpad/,
    /trackpad/,
    /synthetic browser events/,
    /actual input/,
    /реальн.*ввод/,
  ])

  if (actualInputModalitySignal) {
    bump(state, 'T3', 'D3', 'actual_input_modality_min_t3', 'actual input modality evidence signal', 'evidence', 4)
  }

  const shippingSignal = has(text, [
    /\bpr\b/,
    /branch/,
    /merge/,
    /ready_for_pr/,
    /deploy/,
    /ci/,
    /dirty worktree/,
    /ветк/,
  ])

  if (shippingSignal) {
    bump(state, 'T2', 'D2', 'shipping_final_gate', 'PR/branch/deploy signal', 'evidence', 3)
    if (state.intentMode === 'direct_answer') state.intentMode = 'bounded_build'
    state.finalClaimGateRequired = true
  }

  const systemSignal = has(text, [
    /architecture/,
    /operating system/,
    /runtime/,
    /schema/,
    /shared contract/,
    /system grammar/,
    /captain os/,
    /radius/,
    /rag/,
    /context pack/,
    /архитект/,
    /операционн/,
    /радиус/,
  ])

  if (systemSignal) {
    bump(state, 'T3', 'D3', 'system_refactor_min_t3', 'architecture/runtime/context-radius signal', 'blastRadius', 3)
    if (
      state.intentMode === 'direct_answer' ||
      state.intentMode === 'bounded_build' ||
      input.tags.includes('system_refactor') ||
      captainOsAutoBootstrapSignal ||
      input.tags.includes('captain_os_auto_bootstrap')
    ) {
      state.intentMode = 'system_refactor'
    }
  }

  const strategySignal = has(text, [
    /strategy/,
    /business spec/,
    /technical spec/,
    /enterprise/,
    /acceptance matrix/,
    /roles/,
    /routing/,
    /стратег/,
    /бизнес[- ]?спек/,
    /спецификац/,
  ])

  if (strategySignal && !incidentSignal && !systemSignal && !copySignal) {
    state.intentMode = 'strategy_design'
    bump(state, 'T2', 'D2', 'strategy_packet_min_t2', 'strategy/spec/routing signal', 'userIntent', 3)
  }

  const finalClaimSignal = has(text, [
    /\bdone\b/,
    /\bready\b/,
    /\bgreen\b/,
    /\bcanonical\b/,
    /\bworks\b/,
    /\bfixed\b/,
    /accepted_full/,
    /production[- ]ready/,
    /готово/,
    /починено/,
    /канонич/,
  ])

  if (finalClaimSignal) {
    state.finalClaimGateRequired = true
    bump(state, 'T1', 'D1', 'final_claim_gate', 'done/ready/green/fixed signal', 'evidence', 3)
  }

  if (publicSecuritySignal && state.finalClaimGateRequired) {
    state.intentMode = 'incident_repair'
    bump(state, 'T4', 'D4', 'security_final_claim_t4', 'security/public final-readiness claim', 'blastRadius', 5)
  }

  if (state.complexityTier === 'T0' && input.task.trim()) {
    state.complexityTier = 'T1'
    state.planDepth = 'D1'
    state.intentMode = 'bounded_build'
    state.escalationReason = 'Plain task without high-risk signals defaults to bounded T1 shadow classification.'
  } else {
    state.planDepth = maxDepth(state.planDepth, depthForTier[state.complexityTier])
    state.escalationReason = state.triggeredRules.join(', ')
  }

  const hardWorkRequired =
    state.complexityTier === 'T3' ||
    state.complexityTier === 'T4' ||
    state.intentMode === 'incident_repair' ||
    state.intentMode === 'system_refactor' ||
    state.intentMode === 'strategy_design'

  const octopusRequired =
    state.complexityTier === 'T4' ||
    state.intentMode === 'incident_repair' ||
    (state.intentMode === 'system_refactor' && (historySignal || publicSecuritySignal || systemSignal))

  const confidence = state.triggeredRules.length >= 3 ? 'high' : state.triggeredRules.length >= 1 ? 'medium' : 'low'

  return {
    intentMode: state.intentMode,
    complexityTier: state.complexityTier,
    planDepth: state.planDepth,
    captainMode: captainModeFor(state.intentMode, state.complexityTier, shippingSignal),
    riskScores: state.riskScores,
    triggeredRules: [...new Set(state.triggeredRules)],
    matchedSignals: [...new Set(state.matchedSignals)],
    escalationReason: state.escalationReason,
    downgradeReason: null,
    hardWorkRequired,
    octopusRequired,
    finalClaimGateRequired: state.finalClaimGateRequired,
    confidence,
  }
}
