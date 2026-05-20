import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execSync } from 'node:child_process';

function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function getGitStatusFiles() {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (!output) return [];
    return output.split('\n')
      .map(line => line.slice(3).trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getTestScripts() {
  try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.scripts) {
        return Object.keys(pkg.scripts).filter(name => name.includes('test') || name === 'build');
      }
    }
  } catch {}
  return [];
}

export async function runFormulateWizard(interactive = true) {
  console.log('\n\x1b[35m======================================================================\x1b[0m');
  console.log('\x1b[35m🎯 🤖  CAPTAIN OS - ИНТЕРАКТИВНЫЙ ГЕНЕРАТОР ЦЕЛЕЙ ДЛЯ ИИ (DDP)  🤖 🎯\x1b[0m');
  console.log('\x1b[35m======================================================================\x1b[0m\n');
  console.log('Этот инструмент поможет составить идеальную цель по DDP-паттерну');
  console.log('(Declarative-Deterministic-Proactive) с автоопределением контекста.');
  console.log('Полученный промпт позволит ИИ выполнить задачу с первой попытки без зацикливания.\n');

  if (!interactive) {
    console.log('⚡ Запуск генератора целей в неинтерактивном режиме (dry-run)...');
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // 1. Действие (Action)
    console.log('\x1b[1m📝 Шаг 1. Действие (Action)\x1b[0m');
    let action = '';
    while (!action.trim()) {
      action = await askQuestion(rl, '👉 Что вы хотите сделать? Опишите задачу простыми словами:\n   ');
      if (!action.trim()) {
        console.log('\x1b[31m⚠️ Описание действия не может быть пустым. Пожалуйста, введите описание.\x1b[0m');
      }
    }

    // 2. Локализация (Scope)
    console.log('\n\x1b[1m📂 Шаг 2. Границы и Локализация (Scope)\x1b[0m');
    const gitFiles = getGitStatusFiles();
    let scope = '';

    if (gitFiles.length > 0) {
      console.log(`🔍 Обнаружены измененные или новые файлы в Git:`);
      gitFiles.forEach(f => console.log(`   - \x1b[32m${f}\x1b[0m`));
      
      const useGit = await askQuestion(rl, `👉 Ограничить границы (Scope) для ИИ этими файлами? (y/n) [y]: `);
      if (!useGit.trim() || useGit.trim().toLowerCase() === 'y' || useGit.trim().toLowerCase() === 'yes') {
        scope = gitFiles.map(f => `\`${f}\``).join(', ');
      }
    }

    if (!scope) {
      scope = await askQuestion(rl, '👉 Укажите файлы или папки, где ИИ разрешено делать изменения\n   (например: `src/auth/jwt-strategy.ts`): ');
      if (!scope.trim()) {
        scope = 'Любые файлы в рамках проекта (на усмотрение ИИ с соблюдением KISS)';
      }
    }

    // 3. Верификация (Verification)
    console.log('\n\x1b[1m🧪 Шаг 3. Инструменты верификации (Verification)\x1b[0m');
    const testScripts = getTestScripts();
    let verificationCommand = '';

    if (testScripts.length > 0) {
      console.log(`🔍 В package.json найдены команды тестирования/сборки:`);
      testScripts.forEach((s, idx) => console.log(`   ${idx + 1}. \x1b[36mnpm run ${s}\x1b[0m`));
      
      const choice = await askQuestion(rl, `👉 Выберите номер команды или введите свою [1]: `);
      const choiceIdx = parseInt(choice.trim(), 10) - 1;
      if (!isNaN(choiceIdx) && choiceIdx >= 0 && choiceIdx < testScripts.length) {
        verificationCommand = `npm run ${testScripts[choiceIdx]}`;
      } else if (choice.trim()) {
        verificationCommand = choice.trim();
      } else {
        verificationCommand = `npm run ${testScripts[0]}`;
      }
    } else {
      verificationCommand = await askQuestion(rl, '👉 Какую команду запустить для автоматической проверки? [npm run test]: ');
      if (!verificationCommand.trim()) {
        verificationCommand = 'npm run test';
      }
    }

    // 4. Критерий финиша (Deterministic Criteria)
    console.log('\n\x1b[1m🏁 Шаг 4. Детерминированный критерий финиша (Deterministic Criteria)\x1b[0m');
    let criteria = await askQuestion(rl, '👉 Что является признаком успеха? (например, "PASS для всех тест-кейсов"): ');
    if (!criteria.trim()) {
      criteria = 'Успешное выполнение команды проверки без ошибок кода и тестов (Exit Code 0)';
    }

    // 5. Лимиты (Guardrails)
    console.log('\n\x1b[1m🛡️ Шаг 5. Лимиты и предохранители (Guardrails)\x1b[0m');
    let limits = await askQuestion(rl, '👉 Максимальное количество попыток (итераций) до остановки ИИ [5]: ');
    if (!limits.trim() || isNaN(parseInt(limits.trim(), 10))) {
      limits = '5';
    } else {
      limits = limits.trim();
    }

    // 6. Octopus Framework
    console.log('\n\x1b[1m🧠 Шаг 6. Когнитивные фреймворки (Cognitive Frameworks)\x1b[0m');
    const useOctopus = await askQuestion(rl, '👉 Подключить Octopus Framework для оценки Blast Radius перед началом? (y/n) [y]: ');
    const isOctopus = !useOctopus.trim() || useOctopus.trim().toLowerCase() === 'y' || useOctopus.trim().toLowerCase() === 'yes';

    // Формирование итогового DDP промпта
    const octopusPrompt = isOctopus
      ? '\n- **Оценка рисков (Blast Radius):** Перед написанием кода обязательно примените Octopus Framework: исследуйте 4-мерные щупальца зависимостей (прямые импорты, обратные импорты, сайд-эффекты и глобальные контракты), чтобы изменения не задели глобальные типы базы данных или легаси-код.'
      : '';

    const ddpPrompt = `# 🎯 DDP ИИ-ЦЕЛЬ / GOAL PROMPT

> [!IMPORTANT]
> Данная цель сформулирована по строгому паттерну DDP (Declarative-Deterministic-Proactive).
> Агент обязан строго следовать границам, верифицировать результат и остановиться при достижении лимита.

## 1. 📂 Локализация (Scope)
- **Разрешенные пути для модификации:** ${scope}
- **Защита кода:** Запрещено изменять файлы вне указанных путей. Соблюдайте Conscious Agreement.

## 2. ⚙️ Действие (Action)
- **Описание задачи:** ${action}
- **Стиль кода:** Пишите минимально возможные изменения, придерживаясь принципа KISS (Изначальная лаконичность). Опирайтесь на существующие паттерны в кодовой базе.${octopusPrompt}

## 3. 🧪 Инструменты верификации (Verification)
- **Команда проверки:** \`${verificationCommand}\`
- **Доказательство чистоты кода:** После успешной проверки выведите в консоль финальный \`git diff\` измененных файлов, чтобы судья мог визуально подтвердить чистоту внесенных изменений.

## 4. 🏁 Конкретный критерий финиша (Deterministic Criteria)
- **Критерий успеха:** ${criteria}
- ИИ-судья должен увидеть в консоли строгое подтверждение прохождения тестов/сборки (Exit Code 0).

## 5. 🛡️ Лимиты и предохранители (Guardrails)
- **Максимум попыток:** ${limits} итераций
- **Предохранитель:** Если после ${limits} итераций критерий финиша не достигнут, остановите выполнение, выведите логи ошибок компилятора/тестов на экран и верните управление разработчику.
`;

    // Запись в .captain-os/goal.md
    const configDir = path.resolve(process.cwd(), '.captain-os');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    const goalPath = path.resolve(configDir, 'goal.md');
    fs.writeFileSync(goalPath, ddpPrompt, 'utf8');

    console.log('\n\x1b[32m======================================================================\x1b[0m');
    console.log(`🎉 Идеальный DDP-промпт успешно сгенерирован и сохранен в:`);
    console.log(`   \x1b[36m.captain-os/goal.md\x1b[0m`);
    console.log('\x1b[32m======================================================================\x1b[0m\n');
    console.log('Вы можете скопировать следующий блок и вставить его при запуске команды /goal:\n');
    
    console.log('\x1b[33m--- НАЧАЛО ПРОМПТА ---\x1b[0m');
    console.log(ddpPrompt);
    console.log('\x1b[33m--- КОНЕЦ ПРОМПТА ---\x1b[0m\n');

  } catch (err) {
    console.error('❌ Ошибка во время работы Goal Formulator:', err);
  } finally {
    rl.close();
  }
}
