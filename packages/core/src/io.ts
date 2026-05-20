import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

export class LabInputError extends Error {
  code = 3
}

export class LabUnsafeWriteError extends Error {
  code = 5
}

export function repoRoot(): string {
  return process.cwd()
}

export function labRunsRoot(rootDir = repoRoot()): string {
  return resolve(rootDir, '.ship/lab/runs')
}

function assertInside(parent: string, child: string, message: string): void {
  const rel = relative(parent, child)
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new LabUnsafeWriteError(message)
  }
}

export function assertSafeShadowOutDir(outDir: string, rootDir = repoRoot()): string {
  const allowedRoot = labRunsRoot(rootDir)
  const resolved = resolve(rootDir, outDir)
  assertInside(allowedRoot, resolved, `shadow output must be under .ship/lab/runs/<run-id>: ${outDir}`)
  return resolved
}

export function resolveRunFile(outDir: string, fileName: string): string {
  if (fileName.includes('/') || fileName.includes('\\')) {
    throw new LabUnsafeWriteError(`artifact file name must not contain path separators: ${fileName}`)
  }
  const resolved = resolve(outDir, fileName)
  assertInside(outDir, resolved, `artifact write escaped run directory: ${fileName}`)
  return resolved
}

export function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true })
}

export function readText(path: string): string {
  return readFileSync(path, 'utf8')
}

export function readJson<T>(path: string): T {
  return JSON.parse(readText(path)) as T
}

export function writeJson(path: string, value: unknown): void {
  ensureDir(dirname(path))
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export function writeText(path: string, value: string): void {
  ensureDir(dirname(path))
  writeFileSync(path, value.endsWith('\n') ? value : `${value}\n`, 'utf8')
}

export function fileExists(path: string): boolean {
  return existsSync(path)
}

export function gitRef(): string {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

export function digestText(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'captain-lab-run'
}

export function timestampRunId(seed: string): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  return `${stamp}-${slugify(seed)}`
}

