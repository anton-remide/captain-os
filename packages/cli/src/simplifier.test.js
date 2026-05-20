import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  createBackupSnapshot, 
  restoreBackupSnapshot, 
  logTelemetry,
  getGitStatus
} from './simplifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем временную директорию для тестов
const testTmpDir = path.join(__dirname, 'test-sandbox');

test.before(() => {
  if (fs.existsSync(testTmpDir)) {
    fs.rmSync(testTmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testTmpDir, { recursive: true });
});

test.after(() => {
  if (fs.existsSync(testTmpDir)) {
    fs.rmSync(testTmpDir, { recursive: true, force: true });
  }
});

test('Simplifier: Snapshot & Restore (Авиационное резервирование)', () => {
  // 1. Создаем тестовые файлы в песочнице
  const file1 = 'src/pages/Home.js';
  const file2 = 'shared/utils.js';
  
  const f1Path = path.join(testTmpDir, file1);
  const f2Path = path.join(testTmpDir, file2);
  
  fs.mkdirSync(path.dirname(f1Path), { recursive: true });
  fs.mkdirSync(path.dirname(f2Path), { recursive: true });
  
  fs.writeFileSync(f1Path, 'const a = 1;', 'utf8');
  fs.writeFileSync(f2Path, 'const b = 2;', 'utf8');
  
  // 2. Создаем снапшот
  createBackupSnapshot(testTmpDir, [file1, file2]);
  
  const snapshotManifestPath = path.join(testTmpDir, '.captain-os', 'snapshots', 'simplification-before', 'manifest.json');
  assert.ok(fs.existsSync(snapshotManifestPath), 'Манифест снапшота должен быть создан');
  
  const manifest = JSON.parse(fs.readFileSync(snapshotManifestPath, 'utf8'));
  assert.strictEqual(manifest[file1], 'const a = 1;', 'Содержимое Home.js в манифесте должно совпадать');
  assert.strictEqual(manifest[file2], 'const b = 2;', 'Содержимое utils.js в манифесте должно совпадать');
  
  // 3. Имитируем падение/изменение (записываем плохой код)
  fs.writeFileSync(f1Path, 'const brokenCode = error;', 'utf8');
  
  // 4. Восстанавливаем снапшот (Mechanical Rollback)
  const restoreResult = restoreBackupSnapshot(testTmpDir);
  assert.ok(restoreResult, 'Восстановление должно пройти успешно');
  
  // 5. Проверяем, что исходный код вернулся
  assert.strictEqual(fs.readFileSync(f1Path, 'utf8'), 'const a = 1;', 'Исходный код Home.js должен восстановиться');
});

test('Simplifier: Telemetry Logging (Логирование в Бензобак)', () => {
  const ledgerRelativePath = '.ship/repair-ledger.json';
  const ledgerFullPath = path.join(testTmpDir, ledgerRelativePath);
  
  // Очистим если существовал
  if (fs.existsSync(ledgerFullPath)) {
    fs.unlinkSync(ledgerFullPath);
  }
  
  // Запишем мок-проект манифест для настройки пути
  const captainOsDir = path.join(testTmpDir, '.captain-os');
  fs.mkdirSync(captainOsDir, { recursive: true });
  fs.writeFileSync(
    path.join(captainOsDir, 'project.yaml'), 
    `name: test-project\nrepairLedger: ${ledgerRelativePath}\n`, 
    'utf8'
  );
  
  const metrics = {
    filesTouched: 3,
    linesSaved: 25,
    compressionRatio: 0.15,
    status: 'success'
  };
  
  logTelemetry(testTmpDir, metrics);
  
  assert.ok(fs.existsSync(ledgerFullPath), 'Файл реестра ремонта должен быть создан');
  
  const ledger = JSON.parse(fs.readFileSync(ledgerFullPath, 'utf8'));
  assert.strictEqual(ledger.length, 1, 'Должна быть ровно одна запись телеметрии');
  
  const entry = ledger[0];
  assert.ok(entry.id.startsWith('SIMPLIFY-'), 'ID должен начинаться с SIMPLIFY-');
  assert.strictEqual(entry.metrics.filesTouched, 3, 'Количество файлов должно быть 3');
  assert.strictEqual(entry.metrics.linesSaved, 25, 'Количество сохраненных строк должно быть 25');
  assert.strictEqual(entry.metrics.compressionRatio, '0.15', 'Уровень сжатия должен быть 0.15');
  assert.strictEqual(entry.metrics.status, 'success', 'Статус должен быть success');
});
