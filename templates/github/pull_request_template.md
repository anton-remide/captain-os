# 🏎️ Captain OS: Change & Quality Packet

## 📝 1. Описание изменений (Change Summary)
* **ID задачи / REPAIR-ID**: `REPAIR-YYYYMMDD-XXXX`
* **Что сделано (What)**: 
* **Почему это сделано (Why)**: 
* **Затронутые компоненты (Where)**: 

---

## 🔍 2. Splash & Blast Radius Assessment
* **Splash Radius (Измененные файлы)**:
  * `[NEW]` — 
  * `[MODIFY]` — 
* **Blast Radius (Косвенно затронутые файлы/компоненты)**:
  * 

---

## 🛡️ 3. Чек-лист Гейтов Качества (Quality Gates)
*Перед отправкой PR на ревью убедитесь, что все локальные гейты пройдены:*

- [ ] **KISS Enforced**: Изменения минимальны. Добавлен необходимый минимум строк и функций с упором на RAG-контекст.
- [ ] **Conscious Agreement**: Все изменения в старых стабильных файлах (`[MODIFY]`) согласованы с владельцем проекта (Conscious Agreement получен).
- [ ] **Mechanical Rollback**: Перед рефакторингом созданы резервные снимки. Локальные тесты успешно пройдены, авто-откат не потребовался.
- [ ] **Fermat Quality Checked**: Запущена команда проверки локфайла `npx captain-os validate-lock`. Блокировки отсутствуют.
- [ ] **Telemetry Logged**: Результаты рефакторинга (Compression Ratio, сохраненные строки) записаны в Реестр ремонта (`.ship/repair-ledger.json`).
- [ ] **PR Size Checked**: Общий размер PR не превышает лимиты (рекомендуется до 25-30 файлов).

---

## 🧪 4. Результаты верификации (Verification Results)
*Приложите результаты выполнения тестов или скриншоты:*

```bash
# Вывод npx captain-os doctor или npm run test
```
