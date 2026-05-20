import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as readline from 'node:readline';

function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

export async function runConfigureWizard(interactive = true) {
  console.log('\n\x1b[36m======================================================================\x1b[0m');
  console.log('\x1b[36m⚙️  🤖  Captain OS - Интерактивный Мастер Кастомизации  🤖  ⚙️\x1b[0m');
  console.log('\x1b[36m======================================================================\x1b[0m\n');
  console.log('Этот интерактивный опросник поможет адаптировать гейты качества и правила');
  console.log('Captain OS под архитектурные стандарты, стек и ограничения вашего проекта.\n');

  const configDir = resolve(process.cwd(), '.captain-os');
  const projectYamlPath = resolve(configDir, 'project.yaml');
  const customRulesPath = resolve(configDir, 'custom-rules.md');

  // Читаем текущий проектный файл для предзаполнения значений по умолчанию
  let currentProjectYaml = '';
  if (existsSync(projectYamlPath)) {
    try {
      currentProjectYaml = readFileSync(projectYamlPath, 'utf8');
    } catch {}
  }

  const rl = interactive
    ? readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
    : null;

  try {
    // Вопрос 1: KISS-правила
    console.log('\x1b[1m🧠 Вопрос 1: KISS-правила кодирования (Rules of KISS Coding)\x1b[0m');
    console.log('   Укажите стандарты лаконичности кода для ИИ (например: "только плоские функции",');
    console.log('   "максимальная длина функции 50 строк", "запретить сложные классы", "писать в функциональном стиле").');
    let kissRules = 'Писать лаконичный код без избыточности. Использовать чистые плоские функции вместо переусложненных классов, стремиться к максимальной простоте.';
    if (rl) {
      const ans = await askQuestion(rl, `   Ваш ответ [${kissRules}]: `);
      if (ans.trim()) kissRules = ans.trim();
    }

    // Вопрос 2: Legacy-папки и Conscious Agreement
    console.log('\n\x1b[1m🔒 Вопрос 2: Legacy-папки и политика Conscious Agreement\x1b[0m');
    console.log('   Какие файлы или папки считаются легаси, в которых ИИ запрещено проводить');
    console.log('   несогласованный автоматический рефакторинг? (например: "src/legacy", "src/vendor").');
    let legacyPaths = 'legacy, vendor, src/ui-old';
    if (rl) {
      const ans = await askQuestion(rl, `   Ваш ответ [${legacyPaths}]: `);
      if (ans.trim()) legacyPaths = ans.trim();
    }

    // Вопрос 3: Команда тестов для Mechanical Rollback
    console.log('\n\x1b[1m🧪 Вопрос 3: Авто-тесты и Mechanical Rollback\x1b[0m');
    console.log('   Какая CLI-команда запускает юнит-тесты на вашем проекте?');
    console.log('   Снапшот-движок использует её для проверки стабильности рантайма перед упрощением кода.');
    let testCmd = 'npm run test';
    if (rl) {
      const ans = await askQuestion(rl, `   Ваш ответ [${testCmd}]: `);
      if (ans.trim()) testCmd = ans.trim();
    }

    // Вопрос 4: Правила дизайн-системы
    console.log('\n\x1b[1m📐 Вопрос 4: Контроль Дизайн-Системы и UI-токенов\x1b[0m');
    console.log('   Каковы правила работы с UI на вашем проекте? (например: "использовать CSS-токены из');
    console.log('   tokens.css", "запретить инлайновые стили", "использовать Tailwind CSS", "строго следовать UI-библиотеке").');
    let uiRules = 'Соблюдать дизайн-систему проекта. Запретить inline-стили и ad-hoc цвета, использовать только зарегистрированные токены.';
    if (rl) {
      const ans = await askQuestion(rl, `   Ваш ответ [${uiRules}]: `);
      if (ans.trim()) uiRules = ans.trim();
    }

    // Вопрос 5: Границы безопасности
    console.log('\n\x1b[1m🛡️ Вопрос 5: Границы окружений и Утечки данных (Boundary Gate)\x1b[0m');
    console.log('   Какие роуты, папки или ключи считаются приватными и не должны утекать в публичные клиентские сборки?');
    console.log('   (например: "/admin", "/cms", ".env", "privateKey", "internal route").');
    let securityBoundaries = '/admin, /cms, .env, privateKey, secretToken';
    if (rl) {
      const ans = await askQuestion(rl, `   Ваш ответ [${securityBoundaries}]: `);
      if (ans.trim()) securityBoundaries = ans.trim();
    }

    console.log('\n\x1b[32m💾 Запись настроек кастомизации...\x1b[0m');

    // 1. Создаем директорию .captain-os, если не существует
    if (!existsSync(configDir)) {
      try {
        mkdirSync(configDir, { recursive: true });
      } catch {}
    }

    // 2. Парсим или обновляем project.yaml с добавлением customConfiguration
    let updatedYamlContent = '';
    if (currentProjectYaml) {
      // Если файл есть, вырежем старый блок customConfiguration, если он был
      const lines = currentProjectYaml.split('\n');
      const filteredLines = [];
      let skip = false;
      for (const line of lines) {
        if (line.trim().startsWith('customConfiguration:')) {
          skip = true;
          continue;
        }
        if (skip && line.trim() && !line.startsWith(' ') && !line.startsWith('-')) {
          skip = false;
        }
        if (!skip) {
          filteredLines.push(line);
        }
      }
      updatedYamlContent = filteredLines.join('\n').trim() + '\n\n';
    } else {
      updatedYamlContent = `schemaVersion: captain-project.v1
captainOsVersion: 0.1.0-local-p11a
mode: shadow
ownerName: Anton
projectName: universal-project
tracking: REPAIR-20260520-CAPTAIN-DYNAMIC-SETUP

runtimes:
  strategy: dynamic_session_first
  primaryOptions:
    - gemini-3.1-pro
    - claude-4.7
    - codex-5.3
    - gpt-5.5
  reviewers:
    - claude-4.7
  optionalJudges:
    - gemini-3.1-pro
\n`;
    }

    updatedYamlContent += `customConfiguration:
  kissGuidelines: "${kissRules.replace(/"/g, '\\"')}"
  legacyPaths: "${legacyPaths.replace(/"/g, '\\"')}"
  testCommand: "${testCmd.replace(/"/g, '\\"')}"
  designSystemGuidelines: "${uiRules.replace(/"/g, '\\"')}"
  securityBoundaries: "${securityBoundaries.replace(/"/g, '\\"')}"
`;

    writeFileSync(projectYamlPath, updatedYamlContent, 'utf8');
    console.log('✅ Манифест обновлен: .captain-os/project.yaml');

    // 3. Генерируем .captain-os/custom-rules.md - полноценный кастомный промпт для ЛЛМ-агентов!
    const customRulesContent = `# 👑 Captain OS - Локальные Правила Проекта (Custom Rules)

Этот файл сгенерирован автоматически интерактивным Prompt-опросником. Активный ИИ-Капитан (Gemini, Claude, Codex) обязан загрузить этот файл перед любым изменением исходного кода и строго соблюдать описанные ниже инварианты.

---

## 🧠 1. Стандарты лаконичности кода (KISS Guidelines)
При написании и упрощении кода (SimplifyCode Pipeline / Gate 6) руководствуйтесь следующими правилами:
> **Правило:** ${kissRules}

## 🔒 2. Политика Legacy и Conscious Agreement
Следующие папки и пути являются неприкосновенными. Любые попытки изменить код в них без явного согласия Оператора заблокируют гейты качества:
> **Legacy Paths:** \`${legacyPaths}\`
> **Протокол:** При изменении файлов в этих путях, ИИ обязан вывести side-by-side diff изменений и дождаться согласия разработчика.

## 🧪 3. Безопасность рантайма (Mechanical Rollback)
Снапшот-движок использует следующую команду для верификации здоровья приложения после упрощения:
> **Тестовая команда:** \`${testCmd}\`
> **Протокол:** Если команда возвращает ошибку (non-zero exit code), ИИ-агент обязан незамедлительно откатить изменения до сохраненного снапшота.

## 📐 4. Конституция Дизайн-Системы и Стилизации
При создании и модификации UI-компонентов ИИ-агент обязан строго соблюдать следующие ограничения:
> **UI Guidelines:** ${uiRules}

## 🛡️ 5. Границы окружений и Утечки роутов (Security Boundary Gate)
В продакшен контур публичного приложения категорически запрещена утечка админ-элементов, приватных данных и роутов.
> **Защищенные зоны/сигналы:** \`${securityBoundaries}\`
> **Протокол:** Любые совпадения этих путей и ключевых слов в собираемом публичном бандле приведут к аварийному отказу гейта на CI/CD сервере.

---
*Сгенерировано мастером настройки Captain OS configure. Вы можете перезапустить опросник в любой момент с помощью команды: npx captain-os configure*
`;

    writeFileSync(customRulesPath, customRulesContent, 'utf8');
    console.log('✅ Созданы инструкции для ИИ-агентов: .captain-os/custom-rules.md');

    console.log('\n\x1b[32m🎉 Кастомизация мета-ОС Captain OS успешно завершена!\x1b[0m');
    console.log('Теперь все ИИ-агенты будут автоматически считывать эти правила и проверять гейты качества в соответствии с вашим стеком.\n');

  } catch (err) {
    console.error('❌ Ошибка во время настройки кастомизации:', err);
  } finally {
    if (rl) rl.close();
  }
}
