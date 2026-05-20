import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function evaluateReadiness() {
  const root = process.cwd();
  const report = {
    score: 0,
    checks: {
      projectManifest: false,
      adaptersConfigured: false,
      ragIndexed: false,
      ledgerAndFermatActive: false,
      evidenceGatesLive: false,
    },
    missing: [],
  };

  // 1. Project Manifest (.captain-os/project.yaml)
  const manifestPath = resolve(root, '.captain-os/project.yaml');
  if (existsSync(manifestPath)) {
    report.checks.projectManifest = true;
    report.score += 20;
  } else {
    report.missing.push('Отсутствует манифест проекта `.captain-os/project.yaml` (запустите `npx captain-os init`)');
  }

  // 2. Adapters Configured (.captain-os/runtime-adapters.yaml)
  const adaptersPath = resolve(root, '.captain-os/runtime-adapters.yaml');
  if (existsSync(adaptersPath)) {
    report.checks.adaptersConfigured = true;
    report.score += 20;
  } else {
    report.missing.push('Отсутствует конфигурация адаптеров `.captain-os/runtime-adapters.yaml` (запустите `npx captain-os init`)');
  }

  // 3. RAG Indexed (.brain/ or .brain/rag-index.json)
  const brainPath = resolve(root, '.brain');
  if (existsSync(brainPath)) {
    report.checks.ragIndexed = true;
    report.score += 20;
  } else {
    report.missing.push('RAG-база знаний не проиндексирована (запустите `npm run brain:index` в корне проекта)');
  }

  // 4. Ledger & Fermat Active
  const ledgerPath = resolve(root, '.ship/repair-ledger.json');
  if (existsSync(ledgerPath)) {
    try {
      JSON.parse(readFileSync(ledgerPath, 'utf8'));
      report.checks.ledgerAndFermatActive = true;
      report.score += 20;
    } catch {
      report.missing.push('Реестр `.ship/repair-ledger.json` существует, но содержит ошибки синтаксиса JSON');
    }
  } else {
    report.missing.push('Отсутствует реестр качества `.ship/repair-ledger.json` (запустите `npm run repair:gate` или создайте его)');
  }

  // 5. Evidence Gates Live
  const workflowPath = resolve(root, '.github/workflows');
  const scriptsPath = resolve(root, 'scripts/captain-lab/smoke.ts');
  const scriptsJsPath = resolve(root, 'scripts/captain-lab/smoke.js');
  if (existsSync(workflowPath) || existsSync(scriptsPath) || existsSync(scriptsJsPath)) {
    report.checks.evidenceGatesLive = true;
    report.score += 20;
  } else {
    report.missing.push('Не настроены Evidence Gates / авто-тесты контроля деплоя в scripts/captain-lab/ или .github/workflows/');
  }

  return report;
}

export function getTerminalColorDepth() {
  if (typeof process === 'undefined') return 2;
  
  if (process.env.NO_COLOR) {
    return 2;
  }

  const colorterm = process.env.COLORTERM || '';
  if (colorterm === 'truecolor' || colorterm === '256color') {
    return 256;
  }

  try {
    const colorsOutput = execSync('tput colors', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const colorsCount = parseInt(colorsOutput, 10);
    if (!isNaN(colorsCount) && colorsCount > 0) {
      return colorsCount;
    }
  } catch {
    // Ignore tput errors
  }

  const term = process.env.TERM || '';
  if (term.includes('256')) {
    return 256;
  }
  if (term.includes('color') || term.includes('ansi') || term.includes('xterm')) {
    return 16;
  }

  return 2;
}

function getProgressBar(score) {
  const width = 20;
  const filledWidth = Math.round((score / 100) * width);
  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(width - filledWidth);
  
  const depth = getTerminalColorDepth();

  if (depth < 8) {
    return `[${filled}${empty}] ${score}%`;
  }

  if (depth >= 256) {
    let pastelColor = '\x1b[38;5;210m'; // Пастельный розово-красный (0-39%)
    if (score >= 100) {
      pastelColor = '\x1b[38;5;120m'; // Контрастный пастельный салатовый (100%)
    } else if (score >= 70) {
      pastelColor = '\x1b[38;5;116m'; // Пастельная бирюза (70-99%)
    } else if (score >= 40) {
      pastelColor = '\x1b[38;5;222m'; // Пастельный персиковый (40-69%)
    }
    return `${pastelColor}[${filled}${empty}]\x1b[0m \x1b[1m${score}%\x1b[0m`;
  }

  let classicColor = '\x1b[31m';
  if (score >= 100) classicColor = '\x1b[32m';
  else if (score >= 70) classicColor = '\x1b[32m';
  else if (score >= 40) classicColor = '\x1b[33m';
  
  return `${classicColor}[${filled}${empty}]\x1b[0m \x1b[1m${score}%\x1b[0m`;
}

export function printReadinessConsole() {
  const report = evaluateReadiness();
  console.log('\n======================================================');
  console.log(`📊 Статус готовности Captain OS: ${getProgressBar(report.score)}`);
  console.log('======================================================\n');

  const depth = getTerminalColorDepth();
  const isColor = depth >= 8;
  const green = isColor ? '\x1b[32m\x1b[1m' : '';
  const red = isColor ? '\x1b[31m\x1b[1m' : '';
  const yellow = isColor ? '\x1b[33m\x1b[1m' : '';
  const reset = isColor ? '\x1b[0m' : '';

  if (report.score === 100) {
    console.log(`${green}       _______
     .-'       '---------.
   .'   _..---.._        '.      🏎️  Captain OS: FULL SPEED ACTIVE!
  /   .'         '.  _..---'-.   🌟 100% Мощности & Стабильности
 |   /   [===]     \\/  .'     '. ⚡ Все системы запущены
 [==================| /  [==]   ]
 |   \\             /| \\       .'
  \\   '.         .'  '-'-----'
   '.   \`'-----'\`   .'
     '-.________.-'${reset}\n`);
    console.log(`🎉  ${green}Поздравляем!${reset} Ваша Captain OS настроена на 100% мощности и полностью готова к полету.`);
  } else {
    console.log(`${yellow}       _______
     .-'       '---------.
   .'   _..---.._        '.      ⚠️  SYSTEM STATUS: DEGRADED
  /   .'   🔧    '.  _..---'-.   🔧 Готовность менее 100%
 |   /   [ X ]     \\/  .'     '. 🛠️  Требуется техобслуживание
 [==================| /  [!!]   ]
 |   \\             /| \\       .'
  \\   '.         .'  '-'-----'
   '.   \`'-----'\`   .'
     '-.________.-'${reset}\n`);
    console.log(`⚠️  ${yellow}Обнаружены недостающие элементы:${reset}`);
    report.missing.forEach((msg) => console.log(`  - ${msg}`));
    console.log(`\nЧтобы поднять готовность до 100%, выполните указанные рекомендации.`);
  }
}

// Запуск при прямом вызове
const isMainFile = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (isMainFile) {
  printReadinessConsole();
}
