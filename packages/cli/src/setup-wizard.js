import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import * as readline from 'node:readline';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function detectPackageManager() {
  const root = process.cwd();
  if (existsSync(resolve(root, 'bun.lockb')) || existsSync(resolve(root, 'bun.lock'))) {
    return 'bun';
  }
  if (existsSync(resolve(root, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (existsSync(resolve(root, 'yarn.lock'))) {
    return 'yarn';
  }
  try {
    execSync('which bun', { stdio: 'ignore' });
    return 'bun';
  } catch {
    return 'npm';
  }
}

function checkRuntimeEnvironment() {
  let hasBun = false;
  let hasNode = false;
  
  try {
    execSync('bun --version', { stdio: 'ignore' });
    hasBun = true;
  } catch {}
  
  try {
    execSync('node --version', { stdio: 'ignore' });
    hasNode = true;
  } catch {}
  
  return {
    bun: hasBun,
    node: hasNode,
    preferred: hasBun ? 'bun' : 'node',
  };
}

export async function runSetupWizard(interactive = true, defaults = {}) {
  console.log('\n======================================================================');
  console.log('🚀  🤖  Plexo Captain OS - Интерактивный Мастер Настройки  🤖  🚀');
  console.log('======================================================================\n');
  console.log('Привет! Этот мастер поможет быстро развернуть Captain OS на вашем проекте.');
  console.log('Система полностью универсальна, независима от моделей (LLM-agnostic) и');
  console.log('автоматически делает Капитаном ту модель, через которую вы начали сессию!\n');

  const env = checkRuntimeEnvironment();
  console.log('🔍 Анализ рантайм-окружения на хост-машине:');
  console.log(`   - Node.js: ${env.node ? '✅ Доступен' : '❌ Не найден (рекомендуется установить)'}`);
  console.log(`   - Bun:     ${env.bun ? '✅ Доступен (рекомендуется для сверхбыстрой работы)' : '⚠️ Не найден (используем Node.js)'}`);
  console.log(`   - Выбран рантайм по умолчанию: \x1b[36m${env.preferred.toUpperCase()}\x1b[0m\n`);

  const rl = interactive
    ? readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
    : null;

  try {
    // 1. Имя проекта
    let projectName = defaults.projectName || 'plexo-project';
    if (rl) {
      const ans = await askQuestion(rl, `📦 Имя вашего проекта [${projectName}]: `);
      if (ans.trim()) projectName = ans.trim();
    }

    // 2. Имя владельца
    let ownerName = defaults.ownerName || 'Anton';
    if (rl) {
      const ans = await askQuestion(rl, `👨‍💻 Имя главного разработчика/владельца [${ownerName}]: `);
      if (ans.trim()) ownerName = ans.trim();
    }

    // 3. Поддерживаемые LLM модели
    let runtimesStr = defaults.runtimes?.join(', ') || 'gemini-coding, claude-code, codex';
    if (rl) {
      console.log('\n🧠 Какие языковые модели (LLMs) вы планируете запускать на этой машине?');
      console.log('   У нас действует Dynamic Captain Mode: кто первый запущен — тот и Капитан!');
      console.log('   Варианты: gemini-coding, claude-code, codex');
      const ans = await askQuestion(rl, `   Укажите поддерживаемые модели через запятую [${runtimesStr}]: `);
      if (ans.trim()) runtimesStr = ans.trim();
    }
    const runtimes = runtimesStr.split(',').map((r) => r.trim()).filter(Boolean);

    // 4. Директории для RAG
    let ragPathsStr = defaults.ragPaths?.join(', ') || 'src, docs';
    if (rl) {
      console.log('\n📚 Откуда строить локальную базу знаний RAG по документации и исходникам?');
      const ans = await askQuestion(rl, `   Укажите директории через запятую [${ragPathsStr}]: `);
      if (ans.trim()) ragPathsStr = ans.trim();
    }
    const ragPaths = ragPathsStr.split(',').map((p) => p.trim()).filter(Boolean);

    // 5. Путь к реестру ремонта
    let ledgerPath = defaults.ledgerPath || '.ship/repair-ledger.json';
    if (rl) {
      const ans = await askQuestion(rl, `🛠️ Путь к реестру дефектов/ремонта (.ship/repair-ledger.json) [${ledgerPath}]: `);
      if (ans.trim()) ledgerPath = ans.trim();
    }

    console.log('\n💾 Генерация конфигурационных файлов...');

    const configDir = resolve(process.cwd(), '.captain-os');
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // Генерация project.yaml
    const projectYamlContent = `schemaVersion: captain-project.v1
captainOsVersion: 0.1.0-local-p11a
mode: shadow
ownerName: ${ownerName}
projectName: ${projectName}
tracking: REPAIR-20260520-CAPTAIN-DYNAMIC-SETUP

runtimes:
  strategy: dynamic_session_first  # Капитаном становится модель, которая первая запустила текущую сессию
  primaryOptions:
${runtimes.map((r) => `    - ${r}`).join('\n')}
  reviewers:
    - claude-code
  optionalJudges:
    - gemini-coding

readinessCriteria:
  projectManifest: 20
  adaptersConfigured: 20
  ragIndexed: 20
  ledgerAndFermatActive: 20
  evidenceGatesLive: 20

sourceOfTruth:
  strategic: docs
  actionable: github
  evidence: local_ship

paths:
  repairLedger: ${ledgerPath}
  labRuns: .ship/lab/runs
  brain: .brain
  processDocs: docs/process
  captainOsDocs: docs/process/captain-os-lab
  productDocs: docs
  runtimeScripts: scripts/captain-lab
  ragSources:
${ragPaths.map((p) => `    - ${p}`).join('\n')}

managedBlocks:
  - AGENTS.md#captain-os-managed
  - CLAUDE.md#captain-os-managed
  - GEMINI.md#captain-os-managed

protectedPaths:
  - src/**
  - production/**
  - .env*
  - ${ledgerPath}
  - .brain/**

localRules:
  language: ru
  maxCaptainChildren: 5
  simpleTaskMode: lightweight
  dangerZones:
    - direct_user_question
    - anger_incident
    - screenshot_visual_acceptance
    - final_claim
    - security_public_boundary
    - accepted_full_claim

evidencePolicy:
  writeArtifactsToProject: true
  writeArtifactsToOsRepo: false
  requireScrubBeforePromotionToCore: true
  globalBlockingEnabled: false
  productAcceptedFullAllowed: false
`;

    // Записываем файл project.yaml
    writeFileSync(resolve(configDir, 'project.yaml'), projectYamlContent, 'utf8');
    console.log(`✅ Создан манифест проекта: .captain-os/project.yaml`);

    // Генерация runtime-adapters.yaml с поддержкой всех указанных моделей
    let adaptersContent = `schemaVersion: captain-runtime-adapters.v1
project: ${projectName}
defaultMode: shadow

adapters:
`;

    if (runtimes.includes('gemini-coding') || runtimes.includes('gemini')) {
      adaptersContent += `  - runtimeId: gemini-coding
    ownerRegistryId: captain-gemini
    instructionEntrypoint: GEMINI.md
    captainEligibility: dynamic
    defaultRole: captain_first
    capabilities:
      readFiles: true
      writeFiles: true
      shell: true
      git: true
      browserScreenshots: true
      webSearch: true
      mcpConnectors: true
      structuredJson: true
      longContext: true
      backgroundParallelism: true
    constraints:
      mutationPolicy: allowed
      approvalPolicy: operator_required
      secretPolicy: no_public_exposure
      contextBudget: scoped_only
    captainOsHooks:
      modeClassifier: manual
      p10DangerStops: manual
      contextRadius: supported
      finalClaimGate: supported
      evidenceAggregation: manual

`;
    }

    if (runtimes.includes('claude-code') || runtimes.includes('claude')) {
      adaptersContent += `  - runtimeId: claude-code
    ownerRegistryId: captain-claude
    instructionEntrypoint: CLAUDE.md
    captainEligibility: dynamic
    defaultRole: captain_first
    capabilities:
      readFiles: true
      writeFiles: true
      shell: true
      git: true
      browserScreenshots: true
      webSearch: true
      mcpConnectors: true
      structuredJson: true
      longContext: true
      backgroundParallelism: true
    constraints:
      mutationPolicy: allowed
      approvalPolicy: operator_required
      secretPolicy: no_public_exposure
      contextBudget: scoped_only
    captainOsHooks:
      modeClassifier: manual
      p10DangerStops: supported
      contextRadius: supported
      finalClaimGate: supported
      evidenceAggregation: manual

`;
    }

    if (runtimes.includes('codex') || runtimes.includes('openai')) {
      adaptersContent += `  - runtimeId: codex
    ownerRegistryId: captain-codex
    instructionEntrypoint: AGENTS.md
    captainEligibility: dynamic
    defaultRole: captain_first
    capabilities:
      readFiles: true
      writeFiles: true
      shell: true
      git: true
      browserScreenshots: true
      webSearch: true
      mcpConnectors: true
      structuredJson: true
      longContext: true
      backgroundParallelism: true
    constraints:
      mutationPolicy: allowed
      approvalPolicy: none
      secretPolicy: no_public_exposure
      contextBudget: scoped_only
    captainOsHooks:
      modeClassifier: supported
      p10DangerStops: supported
      contextRadius: supported
      finalClaimGate: supported
      evidenceAggregation: supported

`;
    }

    writeFileSync(resolve(configDir, 'runtime-adapters.yaml'), adaptersContent, 'utf8');
    console.log(`✅ Создана конфигурация адаптеров: .captain-os/runtime-adapters.yaml`);

    const pm = detectPackageManager();
    const indexCmd = pm === 'bun' ? 'bun run brain:index' : `${pm} run brain:index`;
    const readinessCmd = 'npx captain-os doctor';

    console.log('\n🎉 Онбординг-настройка Captain OS успешно завершена!');
    console.log(`Чтобы проверить статус готовности вашей ОС, вы можете запустить:\n  \x1b[36m${readinessCmd}\x1b[0m\n`);

    if (rl) {
      const runIndex = await askQuestion(rl, '⚡ Хотите прямо сейчас запустить индексацию RAG базы знаний? (y/n) [y]: ');
      if (!runIndex.trim() || runIndex.trim().toLowerCase() === 'y' || runIndex.trim().toLowerCase() === 'yes') {
        console.log(`\nИндексируем базу знаний (${indexCmd})...`);
        try {
          execSync(indexCmd, { stdio: 'inherit' });
          console.log('\n✅ База знаний успешно проиндексирована!');
        } catch (e) {
          console.warn(`\n⚠️ Не удалось запустить индексацию RAG автоматически. Вы можете запустить её вручную позже: ${indexCmd}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Ошибка во время работы setup wizard:', err);
  } finally {
    if (rl) rl.close();
  }
}

// Запуск при прямом вызове
const isMainFile = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (isMainFile) {
  runSetupWizard(true);
}
