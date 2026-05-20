import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateLockFile(lockPath) {
  if (!existsSync(lockPath)) {
    return { valid: false, error: `Файл блокировок отсутствует по пути: ${lockPath}` };
  }

  try {
    const rawContent = readFileSync(lockPath, 'utf8');
    const parsed = JSON.parse(rawContent);

    // 1. Проверяем обязательные поля структуры
    if (!parsed.schemaVersion) {
      return { valid: false, error: 'Отсутствует обязательное поле schemaVersion' };
    }
    if (!parsed.captainOsVersion) {
      return { valid: false, error: 'Отсутствует обязательное поле captainOsVersion' };
    }

    // 2. Проверяем критически важную блокировку для CI/интеграции
    // На серверах CI/CD глобальное блокирование должно быть строго выключено
    if (parsed.globalBlockingEnabled === true) {
      return { 
        valid: false, 
        error: 'ВНИМАНИЕ: Флаг globalBlockingEnabled установлен в true в файле .captain-os.lock.json!\n' +
               'Это заблокирует автоматическую сборку на интеграционном сервере.\n' +
               'Пожалуйста, отключите глобальное блокирование для комита в репозиторий.'
      };
    }

    // 3. Проверяем флаг productAcceptedFullAllowed
    if (parsed.productAcceptedFullAllowed === true) {
      return {
        valid: false,
        error: 'ВНИМАНИЕ: Флаг productAcceptedFullAllowed установлен в true в файле .captain-os.lock.json!\n' +
               'Принятие продукта на 100% (accepted_full) запрещено политиками безопасности ядра.'
      };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Ошибка синтаксиса JSON в файле блокировок: ${err.message}` };
  }
}

export function runValidator() {
  const root = process.cwd();
  const lockPath = resolve(root, '.captain-os.lock.json');
  
  console.log('\n======================================================');
  console.log('🛡️  Валидатор Captain OS Lockfile (.captain-os.lock.json)  🛡️');
  console.log('======================================================\n');

  const result = validateLockFile(lockPath);

  if (result.valid) {
    console.log('✅  \x1b[32m\x1b[1mУспех:\x1b[0m Файл блокировок валиден, безопасен для CI и соответствует регламенту качества!\n');
    process.exit(0);
  } else {
    console.error(`❌  \x1b[31m\x1b[1mОшибка валидации:\x1b[0m ${result.error}\n`);
    process.exit(1);
  }
}

// Запуск при прямом вызове
const isMainFile = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (isMainFile) {
  runValidator();
}
