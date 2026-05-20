import type {
  ClassificationArtifact,
  CrewPlanArtifact,
  EvidenceMatrixArtifact,
  LabInput,
  ScorecardArtifact,
  StarPomVerdictArtifact,
} from './schema'
import { atLeastDepth, atLeastTier } from './schema'

function passFail(condition: boolean, pass: string, fail: string): string {
  return condition ? pass : fail
}

export function buildScorecard(
  input: LabInput,
  classification: ClassificationArtifact,
  crewPlan: CrewPlanArtifact,
  evidenceMatrix: EvidenceMatrixArtifact,
  starpomVerdict: StarPomVerdictArtifact,
): ScorecardArtifact {
  const expected = input.expected
  const requiredSailors = expected?.requiredSailors ?? []
  const sailorsPresent = requiredSailors.every((sailor) => crewPlan.requiredSailors.includes(sailor))
  const expectedBlocks = expected?.requiredBlocks ?? []
  const blocksPresent = expectedBlocks.every((blockId) => evidenceMatrix.rows.some((row) => row.id === blockId))

  const falseGreenRisk = starpomVerdict.blockedClaims.length > 0
    ? 'high'
    : classification.finalClaimGateRequired
      ? 'medium'
      : 'low'

  return {
    modeAccuracy: 'shadow-only mode enforced',
    intentModeAccuracy: expected
      ? passFail(
        classification.intentMode === expected.intentMode,
        `pass: ${classification.intentMode}`,
        `fail: expected ${expected.intentMode}, got ${classification.intentMode}`,
      )
      : 'not fixture-scored',
    complexityTierConfidence: expected
      ? passFail(
        atLeastTier(classification.complexityTier, expected.minComplexityTier) &&
          atLeastDepth(classification.planDepth, expected.minPlanDepth),
        `pass: ${classification.complexityTier}/${classification.planDepth}`,
        `fail: expected at least ${expected.minComplexityTier}/${expected.minPlanDepth}, got ${classification.complexityTier}/${classification.planDepth}`,
      )
      : `${classification.confidence}: ${classification.complexityTier}/${classification.planDepth}`,
    crewSufficiency: requiredSailors.length > 0
      ? passFail(sailorsPresent, `pass: ${requiredSailors.join(', ')}`, `fail: missing required sailors ${requiredSailors.join(', ')}`)
      : crewPlan.requiredSailors.length > 1
        ? `pass: ${crewPlan.requiredSailors.join(', ')}`
        : 'warning: Captain-only low-risk run',
    evidenceSufficiency: expected
      ? passFail(blocksPresent, 'pass: expected advisory blocks detected', 'fail: expected advisory blocks missing')
      : evidenceMatrix.finalVerdict,
    falseGreenRisk,
    operatorBurdenRisk: starpomVerdict.blockedClaims.length >= 4 ? 'high' : starpomVerdict.blockedClaims.length > 0 ? 'medium' : 'low',
    recommendedNextGate: starpomVerdict.blockedClaims[0] ?? 'ready for next shadow/advisory gate',
    fixturesToCreate: expected ? [] : ['promote this run to a fixture if it reflects a repeated miss'],
  }
}

