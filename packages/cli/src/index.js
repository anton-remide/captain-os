#!/usr/bin/env node

import { createSnapshot, rollbackSnapshot, listSnapshots } from './snapshot-engine.js';
import { printReadinessConsole } from './readiness-eval.js';
import { runSetupWizard } from './setup-wizard.js';
import { runValidator } from './lock-validator.js';
import { executeSimplificationPipeline } from './simplifier.js';
import { runConfigureWizard } from './configure-wizard.js';

const command = process.argv[2] || 'help';

if (command === 'doctor') {
  printReadinessConsole();
} else if (command === 'configure') {
  const isDryRun = process.argv.includes('--dry-run');
  runConfigureWizard(!isDryRun);
} else if (command === 'init') {
  const isDryRun = process.argv.includes('--dry-run');
  if (isDryRun) {
    console.log('⚡ Запуск мастера настройки в режиме dry-run (неинтерактивный)...');
    runSetupWizard(false);
  } else {
    runSetupWizard(true);
  }
} else if (command === 'validate-lock' || command === 'check-lock') {
  runValidator();
} else if (command === 'simplify') {
  const isDryRun = process.argv.includes('--dry-run');
  executeSimplificationPipeline(process.cwd(), isDryRun).catch(e => {
    console.error('❌ Конвейер SimplifyCode завершился с ошибкой:', e.message);
    process.exit(1);
  });
} else if (command === 'snapshot' || command === 'snapshots') {
  const subCommand = process.argv[3];
  if (subCommand === 'save' || subCommand === '--save') {
    const description = process.argv[4] || '';
    createSnapshot(process.cwd(), description);
  } else if (subCommand === 'list' || subCommand === '--list' || !subCommand) {
    listSnapshots(process.cwd());
  } else {
    console.log('Usage: npx captain-os snapshot [list | save "Description"]');
  }
} else if (command === 'rollback') {
  const targetId = process.argv[3] || '--last';
  rollbackSnapshot(process.cwd(), targetId);
} else {
  console.log('=== Captain OS CLI ===');
  console.log('Available commands:');
  console.log('  init                 - Initialize project workspace (add --dry-run for non-interactive)');
  console.log('  configure            - Run interactive prompt-wizard to customize project rules');
  console.log('  doctor               - Check environment health and readiness');
  console.log('  validate-lock        - Validate .captain-os.lock.json structure and policies');
  console.log('  simplify             - Run code simplification pipeline (add --dry-run for preview)');
  console.log('  snapshot list        - List all saved snapshots');
  console.log('  snapshot save "desc" - Create a new configuration snapshot');
  console.log('  rollback [id]        - Restore a specific snapshot (default: last)');
}
