import { resolve } from 'node:path'
import type { LabInput, RouteChecklistCoverageArtifact, RouteChecklistRow, RouteChecklistSection } from './schema'
import { fileExists, readText, repoRoot } from './io'

function extractRouteRefs(value: string): string[] {
  const refs = [...value.matchAll(/`(\/[^`]+)`/g)].map((match) => match[1])
  return [...new Set(refs)]
}

function emptyCoverage(path: string | null, parseError: string | null): RouteChecklistCoverageArtifact {
  return {
    path,
    parsed: false,
    parseError,
    totalRows: 0,
    checkedRows: 0,
    openRows: 0,
    openBlockingRows: [],
    sections: [],
  }
}

function currentSection(sections: RouteChecklistSection[], heading: string): RouteChecklistSection {
  const found = sections.at(-1)
  if (found) return found
  const section = { heading, routeRefs: extractRouteRefs(heading), totalRows: 0, checkedRows: 0, openRows: 0, rows: [] }
  sections.push(section)
  return section
}

export function parseRouteChecklistMarkdown(path: string, markdown: string): RouteChecklistCoverageArtifact {
  const sections: RouteChecklistSection[] = []
  let heading = 'Document'
  let headingRefs: string[] = []

  markdown.split(/\r?\n/).forEach((line, index) => {
    const headingMatch = /^(#{2,4})\s+(.+?)\s*$/.exec(line)
    if (headingMatch) {
      heading = headingMatch[2]
      headingRefs = extractRouteRefs(heading)
      sections.push({ heading, routeRefs: headingRefs, totalRows: 0, checkedRows: 0, openRows: 0, rows: [] })
      return
    }

    const rowMatch = /^\s*-\s+\[( |x|X)\]\s+(.+?)\s*$/.exec(line)
    if (!rowMatch) return

    const section = currentSection(sections, heading)
    const routeRefs = [...new Set([...headingRefs, ...extractRouteRefs(rowMatch[2])])]
    const checked = rowMatch[1].toLowerCase() === 'x'
    const row: RouteChecklistRow = {
      id: `CHK-MD-${String(index + 1).padStart(4, '0')}`,
      section: section.heading,
      text: rowMatch[2],
      checked,
      line: index + 1,
      routeRefs,
    }
    section.rows.push(row)
    section.totalRows += 1
    if (checked) section.checkedRows += 1
    else section.openRows += 1
  })

  const rows = sections.flatMap((section) => section.rows)
  const openBlockingRows = rows.filter((row) => !row.checked)
  return {
    path,
    parsed: true,
    parseError: null,
    totalRows: rows.length,
    checkedRows: rows.filter((row) => row.checked).length,
    openRows: openBlockingRows.length,
    openBlockingRows,
    sections: sections.filter((section) => section.totalRows > 0),
  }
}

export function buildRouteChecklistCoverage(input: LabInput): RouteChecklistCoverageArtifact {
  const checklistPath = input.context.routeChecklistPath
  if (!checklistPath) return emptyCoverage(null, null)

  const resolved = resolve(repoRoot(), checklistPath)
  if (!fileExists(resolved)) return emptyCoverage(checklistPath, `route checklist not found: ${checklistPath}`)

  return parseRouteChecklistMarkdown(checklistPath, readText(resolved))
}
