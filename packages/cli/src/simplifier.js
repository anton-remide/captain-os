import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Получение конфигурации из манифеста хост-проекта
function getProjectConfig(cwd) {
  const manifestPath = path.join(cwd, '.captain-os', 'project.yaml');
  let repairLedgerPath = '.ship/repair-ledger.json';
  
  if (fs.existsSync(manifestPath)) {
    try {
      const content = fs.readFileSync(manifestPath, 'utf8');
      const ledgerMatch = content.match(/repairLedger:\s*([^\n\r]+)/);
      if (ledgerMatch && ledgerMatch[1]) {
        repairLedgerPath = ledgerMatch[1].trim();
      }
    } catch (e) {
      // Игнорируем и используем путь по умолчанию
    }
  }
  return { repairLedgerPath };
}

// Получение списка измененных файлов по классификации Антона
export function getGitStatus(cwd = process.cwd()) {
  try {
    const output = execSync('git status --porcelain', { cwd, encoding: 'utf8' });
    const newFiles = [];
    const modifiedFiles = [];
    
    const lines = output.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      const status = line.slice(0, 2);
      const filePath = line.slice(3).trim();
      
      // A - added, ?? - untracked (новые файлы)
      if (status.includes('A') || status.includes('?')) {
        newFiles.push(filePath);
      } else if (status.includes('M')) {
        modifiedFiles.push(filePath);
      }
    }
    return { newFiles, modifiedFiles };
  } catch (e) {
    console.error('⚠️ Ошибка Git при получении статуса:', e.message);
    return { newFiles: [], modifiedFiles: [] };
  }
}

// Создание резервного снапшота перед упрощением (Авиационное резервирование)
export function createBackupSnapshot(cwd = process.cwd(), files = []) {
  const snapshotDir = path.join(cwd, '.captain-os', 'snapshots', 'simplification-before');
  if (fs.existsSync(snapshotDir)) {
    fs.rmSync(snapshotDir, { recursive: true, force: true });
  }
  fs.mkdirSync(snapshotDir, { recursive: true });

  const manifest = {};

  for (const file of files) {
    const srcPath = path.join(cwd, file);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(snapshotDir, file);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      manifest[file] = fs.readFileSync(srcPath, 'utf8');
    }
  }

  fs.writeFileSync(
    path.join(snapshotDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  console.log(`✈️ Создан аварийный снапшот резервирования для ${files.length} файлов.`);
}

// Восстановление из аварийного снапшота
export function restoreBackupSnapshot(cwd = process.cwd()) {
  const snapshotDir = path.join(cwd, '.captain-os', 'snapshots', 'simplification-before');
  const manifestPath = path.join(snapshotDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.warn('⚠️ Аварийный снапшот не найден. Откат невозможен.');
    return false;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const [file, content] of Object.entries(manifest)) {
      const destPath = path.join(cwd, file);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, content, 'utf8');
    }
    console.log('🔄 Успешно выполнен жесткий откат к исходному коду (Mechanical Rollback).');
    return true;
  } catch (e) {
    console.error('❌ Ошибка при восстановлении снапшота:', e.message);
    return false;
  }
}

// Прогон тестов хост-проекта
export function runProjectTests(cwd = process.cwd()) {
  console.log('🧪 Запуск автоматических тестов для верификации эквивалентности...');
  
  // Определяем команду запуска тестов
  let testCmd = 'npm run test';
  if (fs.existsSync(path.join(cwd, 'bun.lockb'))) {
    testCmd = 'bun test';
  } else if (fs.existsSync(path.join(cwd, 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    if (pkg.scripts && pkg.scripts.test) {
      testCmd = 'npm run test';
    }
  }

  try {
    execSync(testCmd, { cwd, stdio: 'inherit' });
    console.log('✅ Все тесты успешно прошли! Эквивалентность функционала подтверждена.');
    return true;
  } catch (e) {
    console.error('❌ Тесты упали после упрощения кода!');
    return false;
  }
}

// Запись телеметрии рефакторинга в Реестр ремонта
export function logTelemetry(cwd = process.cwd(), metrics = {}) {
  const { repairLedgerPath } = getProjectConfig(cwd);
  const ledgerFullPath = path.join(cwd, repairLedgerPath);

  try {
    let ledger = [];
    if (fs.existsSync(ledgerFullPath)) {
      const content = fs.readFileSync(ledgerFullPath, 'utf8');
      if (content.trim()) {
        ledger = JSON.parse(content);
      }
    }

    const logEntry = {
      id: `SIMPLIFY-${Date.now()}`,
      type: 'simplification_run',
      timestamp: new Date().toISOString(),
      metrics: {
        filesTouched: metrics.filesTouched || 0,
        linesSaved: metrics.linesSaved || 0,
        compressionRatio: parseFloat(metrics.compressionRatio || 0).toFixed(2),
        status: metrics.status || 'success'
      }
    };

    ledger.push(logEntry);
    fs.mkdirSync(path.dirname(ledgerFullPath), { recursive: true });
    fs.writeFileSync(ledgerFullPath, JSON.stringify(ledger, null, 2), 'utf8');
    console.log(`📊 Телеметрия рефакторинга записана в Реестр ремонта (${repairLedgerPath}).`);
  } catch (e) {
    console.warn('⚠️ Не удалось записать телеметрию в реестр:', e.message);
  }
}

// Гейт Conscious Agreement (Осознанное согласие Антона)
export function askConsciousAgreement(file) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`\n======================================================`);
    console.log(`🚨 [CONSCIOUS AGREEMENT] Обнаружен старый стабильный файл!`);
    console.log(`Файл: ${file}`);
    console.log(`======================================================`);
    console.log(`⚠️ Любой рефакторинг этого файла требует твоего осознанного согласия.`);
    
    rl.question('👉 Хочешь упростить этот стабильный файл? [Да (Y) / Нет (N)]: ', (answer) => {
      rl.close();
      const approved = ['да', 'y', 'yes', 'д'].includes(answer.trim().toLowerCase());
      resolve(approved);
    });
  });
}

// Главная оркестрация упрощения
export async function executeSimplificationPipeline(cwd = process.cwd(), isDryRun = false) {
  const { newFiles, modifiedFiles } = getGitStatus(cwd);
  
  if (newFiles.length === 0 && modifiedFiles.length === 0) {
    console.log('🌱 Нет измененных файлов для прогона SimplifyCode.');
    return;
  }

  console.log(`\n=== Запуск конвейера SimplifyCode в ${isDryRun ? 'режиме DRY-RUN' : 'активном режиме'} ===`);
  console.log(`✨ Новые файлы (авто-упрощение):`, newFiles);
  console.log(`🔒 Старые файлы (Conscious Agreement):`, modifiedFiles);

  const filesToProcess = [...newFiles];
  const skippedModifiedFiles = [];

  // Обрабатываем старые файлы через гейт согласия
  for (const file of modifiedFiles) {
    if (isDryRun) {
      console.log(`[DRY-RUN] Требуется одобрение для старого файла: ${file}`);
      skippedModifiedFiles.push(file);
      continue;
    }

    const approved = await askConsciousAgreement(file);
    if (approved) {
      console.log(`✅ Одобрено! Старый файл ${file} добавлен в очередь на упрощение.`);
      filesToProcess.push(file);
    } else {
      console.log(`❌ Отклонено! Старый файл ${file} останется без изменений.`);
      skippedModifiedFiles.push(file);
    }
  }

  if (filesToProcess.length === 0) {
    console.log('🌱 Нет файлов для применения рефакторинга.');
    return;
  }

  if (isDryRun) {
    console.log('\n[DRY-RUN] Анализ завершен. Изменения не будут записаны на диск.');
    return;
  }

  // Создаем снапшоты безопасности перед действием
  createBackupSnapshot(cwd, filesToProcess);

  // Симулируем сбор метрик для отчета (в реальном LLM цикле изменения вносятся моделью)
  // Мы замеряем строки до и после
  let totalLinesBefore = 0;
  let totalLinesAfter = 0;

  for (const file of filesToProcess) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      totalLinesBefore += content.split('\n').length;
    }
  }

  console.log('\n✨ Начинается фаза локального садоводства кода...');
  // (Здесь происходит авто-упрощение моделью. В контексте CLI мы проверяем работоспособность тестов)
  
  const testSuccess = runProjectTests(cwd);
  
  if (!testSuccess) {
    console.error('🚨 АВАРИЙНЫЙ ОТКАТ: Тесты упали. Запускается Mechanical Rollback...');
    restoreBackupSnapshot(cwd);
    logTelemetry(cwd, { filesTouched: filesToProcess.length, linesSaved: 0, compressionRatio: 0, status: 'failed_rollback' });
    throw new Error('Simplification failed: Tests did not pass.');
  }

  // Замеряем строки после упрощения
  for (const file of filesToProcess) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      totalLinesAfter += content.split('\n').length;
    }
  }

  const linesSaved = Math.max(0, totalLinesBefore - totalLinesAfter);
  const compressionRatio = totalLinesBefore > 0 ? (linesSaved / totalLinesBefore) : 0;

  console.log(`\n🎉 Рефакторинг успешно завершен!`);
  console.log(`📈 Результаты: спасенных строк: ${linesSaved}, уровень сжатия: ${(compressionRatio * 100).toFixed(1)}%`);

  logTelemetry(cwd, {
    filesTouched: filesToProcess.length,
    linesSaved,
    compressionRatio,
    status: 'success'
  });
}
