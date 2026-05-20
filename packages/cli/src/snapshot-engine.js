import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';

const TARGET_FILES = [
  '.captain-os/project.yaml',
  '.captain-os/runtime-adapters.yaml',
  '.captain-os/owner-registry.yaml',
  '.captain-os/task-spine.yaml',
  'AGENTS.md',
  'GEMINI.md',
  'CLAUDE.md'
];

function getGitRef() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getRegistryPath(cwd) {
  return resolve(cwd, '.captain-os/snapshots/registry.json');
}

export function createSnapshot(cwd, description) {
  const registryPath = getRegistryPath(cwd);
  const snapshotDir = dirname(registryPath);

  if (!existsSync(snapshotDir)) {
    mkdirSync(snapshotDir, { recursive: true });
  }

  let registry = { snapshots: [] };
  if (existsSync(registryPath)) {
    try {
      registry = JSON.parse(readFileSync(registryPath, 'utf8'));
    } catch {
      registry = { snapshots: [] };
    }
  }

  const files = {};
  for (const relPath of TARGET_FILES) {
    const fullPath = resolve(cwd, relPath);
    if (existsSync(fullPath)) {
      files[relPath] = readFileSync(fullPath, 'utf8');
    }
  }

  const gitRef = getGitRef();
  const snapshotId = `snap_${Date.now()}`;
  const newSnapshot = {
    id: snapshotId,
    timestamp: new Date().toISOString(),
    description: description || 'Automatic snapshot',
    gitRef,
    files
  };

  // Add to the beginning of the list
  registry.snapshots.unshift(newSnapshot);

  // Keep only the last 10 snapshots
  if (registry.snapshots.length > 10) {
    registry.snapshots = registry.snapshots.slice(0, 10);
  }

  writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
  console.log(`\x1b[32m✓ Snapshot created successfully: ${snapshotId}\x1b[0m`);
  console.log(`  Description: ${newSnapshot.description}`);
  console.log(`  Git reference: ${newSnapshot.gitRef}`);
  console.log(`  Captured files: ${Object.keys(files).join(', ')}`);
  return snapshotId;
}

export function rollbackSnapshot(cwd, targetId) {
  const registryPath = getRegistryPath(cwd);

  if (!existsSync(registryPath)) {
    console.error('\x1b[31mError: No snapshot registry found. Please create a snapshot first.\x1b[0m');
    return false;
  }

  let registry;
  try {
    registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  } catch (error) {
    console.error('\x1b[31mError reading snapshot registry:\x1b[0m', error.message);
    return false;
  }

  if (!registry.snapshots || registry.snapshots.length === 0) {
    console.error('\x1b[31mError: Snapshot registry is empty.\x1b[0m');
    return false;
  }

  let targetSnapshot;
  if (targetId === '--last' || targetId === 'last' || !targetId) {
    targetSnapshot = registry.snapshots[0];
  } else {
    targetSnapshot = registry.snapshots.find(s => s.id === targetId);
  }

  if (!targetSnapshot) {
    console.error(`\x1b[31mError: Snapshot "${targetId}" not found.\x1b[0m`);
    return false;
  }

  console.log(`\x1b[34mℹ Rolling back to snapshot: ${targetSnapshot.id}...\x1b[0m`);
  console.log(`  Description: ${targetSnapshot.description}`);
  console.log(`  Timestamp: ${targetSnapshot.timestamp}`);
  console.log(`  Target Git Ref: ${targetSnapshot.gitRef}`);

  // Restore each file
  for (const [relPath, content] of Object.entries(targetSnapshot.files)) {
    const fullPath = resolve(cwd, relPath);
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, content, 'utf8');
    console.log(`  \x1b[32m✓ Restored file: ${relPath}\x1b[0m`);
  }

  console.log(`\x1b[32m✓ Rollback completed successfully to snapshot ${targetSnapshot.id}!\x1b[0m`);
  return true;
}

export function listSnapshots(cwd) {
  const registryPath = getRegistryPath(cwd);

  if (!existsSync(registryPath)) {
    console.log('\x1b[33mNo snapshots found. Use "snapshot --save" to create one.\x1b[0m');
    return;
  }

  let registry;
  try {
    registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  } catch {
    console.error('\x1b[31mError reading snapshot registry.\x1b[0m');
    return;
  }

  if (!registry.snapshots || registry.snapshots.length === 0) {
    console.log('\x1b[33mNo snapshots in the registry.\x1b[0m');
    return;
  }

  console.log('\x1b[36m=== Captain OS Snapshot History ===\x1b[0m');
  registry.snapshots.forEach((snap, idx) => {
    const activeMarker = idx === 0 ? ' \x1b[35m[LAST]\x1b[0m' : '';
    console.log(`- \x1b[1m${snap.id}\x1b[22m${activeMarker}`);
    console.log(`  Created: ${snap.timestamp}`);
    console.log(`  Git Ref: ${snap.gitRef}`);
    console.log(`  Files:   ${Object.keys(snap.files).length} files`);
    console.log(`  Desc:    ${snap.description}`);
    console.log('  --------------------------------');
  });
}
