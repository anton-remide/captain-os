# 🔥 Multi-LLM Fire Chat Consensus Protocol

The **Multi-LLM Fire Chat Protocol** is an advanced cognitive engineering and quality assurance framework built into Captain OS. It is designed to completely eliminate single-model hallucinations, architectural biases, and security blind spots during autonomous refactoring cycles.

By running a single specialized expert role across three distinct, leading LLM architectures, the protocol achieves high-fidelity consensus and verification before any code changes are permitted to touch the repository.

---

## 🏛️ Architecture & Operational Flow

When a complex task is dispatched, the system bypasses standard single-agent generation and initiates a parallel, triple-mind consensus process:

```mermaid
graph TD
    Trigger["🛠️ Complex Refactoring Task<br>(e.g., Database Migration)"] --> Analyzer["📋 Domain Dispatcher<br>(DED Engine)"]
    
    subgraph Параллельное исполнение (Fire Chat Engines)
        GenGemini["🧠 Mind A: Gemini 3.1 Pro<br>(Analytical & Context-Dense)"]
        GenClaude["🧠 Mind B: Claude 4.7<br>(Precise & Structured)"]
        GenCodex["🧠 Mind C: Codex 5.3 / GPT-5.5<br>(Algorithmic & Idiomatic)"]
    end

    Analyzer -->|"Dispatches specialized expert role"| GenGemini & GenClaude & GenCodex

    GenGemini -->|Output A| Arbiter["⚖️ SRE Consensus Arbiter<br>(Consolidated Reviewer)"]
    GenClaude -->|Output B| Arbiter
    GenCodex -->|Output C| Arbiter

    subgraph Дебаты и Согласование (Arbitration)
        Arbiter --> DiffCheck{"🔍 2/3 Consensus?<br>(Zero Security Blocks)"}
        DiffCheck -->|Yes| UnifiedDiff["📦 Unified Change Packet<br>(Optimal Refactored Code)"]
        DiffCheck -->|No| Redo["🔄 Fire Debate Loop<br>(Re-querying with critique)"]
        Redo --> GenGemini & GenClaude & GenCodex
    end

    UnifiedDiff --> Apply["💾 Apply Code to Working Tree"]
    Apply --> Gate7["⚙️ Gate 7: Mechanical Rollback Validation"]
    
    style Trigger fill:#f5f5f5,stroke:#333,color:#333
    style GenGemini fill:#e8f4fd,stroke:#4a90d9,color:#333
    style GenClaude fill:#ffebee,stroke:#c62828,color:#333
    style GenCodex fill:#e8f5e9,stroke:#28a745,color:#333
    style Arbiter fill:#fff8e1,stroke:#f9a825,color:#333
    style DiffCheck fill:#fffde7,stroke:#fbc02d,color:#333
    style UnifiedDiff fill:#d4edda,stroke:#28a745,color:#333
    style Redo fill:#ffebee,stroke:#c62828,color:#333
    style Gate7 fill:#fff8e1,stroke:#f9a825,color:#333
```

---

## 📋 Protocol Phases & Strategic Milestones

To maximize resource efficiency and maintain rapid development velocities, the **Multi-LLM Fire Chat Protocol** is strategically positioned at key project milestones rather than running continuously on every keystroke. The operational cycle is structured as follows:

### 🎯 Strategic Placement
1. **Milestone A: The Planning Phase (Baseline Consensus):** Fire Chat is triggered at the absolute start of a task. The triple parallel debate is used to establish the optimal architectural strategy, database schema approach, and boundaries *before* any code is written.
2. **Milestone B: Intermediate Micro-Iterations (Fast Local Dev):** During intermediate coding rounds, a single primary engine writes code, and a highly optimized, fast, and cost-efficient micro-agent (such as **Gemini 3.5 Flash**) acts as the independent local judge/evaluator to run quick verification checks.
3. **Milestone C: The Pre-Merge Phase (Final Gates Audit):** Before code is merged into the `main` branch or sent to deployment (Gate 13), the full Fire Chat protocol is triggered once more to verify the unified diff, catch edge cases, and run the final SRE consensus audit.

---

## 🛠️ Step-by-Step Execution Lifecycle

### Phase 1: Dynamic Role Allocation
The **Dynamic Expert Dispatcher (DED)** inspects the target file paths and context. It generates a highly focused expert prompt matching the domain. 
* *Example:* If modifying `src/database/transactions.ts`, it dispatches the **Database Concurrency & Transaction Isolation Specialist** role.

### Phase 2: Triple Parallel Execution
During Planning and Pre-Merge phases, the prompt is executed concurrently across three distinct API backends:
1. **Gemini 3.1 Pro:** Evaluates deep contextual references and searches for edge cases within large dependency trees.
2. **Claude 4.7:** Produces highly readable, cleanly typed, and structured structural changes.
3. **Codex 5.3 / GPT-5.5:** Focuses on pure algorithmic optimization, local state efficiency, and idiomatic performance.

### Phase 3: SRE Arbitration & Debate
The outputs are compiled by the **SRE Consensus Arbiter**. The Arbiter performs a semantic diff across all three outputs:
* **The Consensus Requirement:** At least two out of three models must agree on the architectural approach and implementation layout.
* **Zero Security Blocks:** If even one model flags a potential security vulnerability (e.g. SQL injection, route exposure, secret leakage), the change is blocked, and the debate is reopened.
* **The Fire Debate:** If consensus is not reached, the Arbiter generates a critical review highlighting the differences (e.g., *"Model A uses optimistic locking, while Model B and C use pessimistic transactions"*). This critique is fed back to the models for a second round of execution.

### Phase 4: Unified Change Synthesis & Micro-Auditing
Once consensus is reached, the Arbiter consolidates the optimal pieces of each model's output into a **Unified Change Packet**. 

* **Micro-Auditing (Gemini 3.5 Flash как Независимый Судья):** During the active coding phase, intermediate revisions are evaluated by a fast, cost-efficient, and dedicated **Gemini 3.5 Flash** micro-agent. This micro-agent acts as the autonomous local "judge" that quickly validates compile states, checks basic lint rules, and ensures intermediate steps don't break the build before the next big code turn.

#### 💡 Почему именно Gemini 3.5 Flash для роли Судьи?
1. **Сверхнизкая задержка (Ultra-low Latency):** При итеративном написании кода разработчик или ИИ не могут ждать по 30–60 секунд ответа от тяжелых моделей на каждый мелкий шаг. Gemini 3.5 Flash возвращает вердикт за 1.5–3 секунды, поддерживая высокий темп разработки.
2. **Задача классификации и верификации:** Оценка промежуточного кода — это преимущественно чтение и сопоставление (анализ вывода компилятора, логов тестов, синтаксических ошибок). Это не требует генеративного воображения глубоких моделей; здесь важна точность парсинга и скорость, где Flash превосходит тяжелые модели по соотношению цена/производительность.
3. **Предотвращение бесконечных субъективных циклов:** Крупные LLM (например, Claude 4.7 или GPT-5.5) склонны «умничать» и бесконечно рефакторить код из субъективных соображений стиля. Маленький изолированный судья беспристрастен: он проверяет только строгие критерии (компилируется ли код, проходят ли тесты, соблюден ли Splash Radius) и выдает жесткий вердикт PASS/FAIL без попыток переписать рабочее решение.

### Phase 5: Closed-Loop Verification
The local SimplifyCode engine immediately triggers **Gate 7 (Mechanical Rollback)**:
- Run the localized test suites.
- If tests pass, the change is approved and telemetry is recorded in the `.ship/repair-ledger.json`.
- If tests fail, the change is instantly discarded, restoring the working tree.

---

## 💡 Why Multi-LLM Fire Chat is Crucial

1. **Hallucination Suppression:** Different LLMs have different training data and cognitive strengths. A hallucination in one engine is instantly caught and discarded by the other two.
2. **Avoiding "Local Minima":** A single model might settle on a lazy, quick-fix solution. The Fire Chat consensus forces a standard of quality that satisfies three distinct neural systems.
3. **Uncompromising Security:** Multiple models reviewing code from different viewpoints acts as a high-density security scanner, preventing accidental vulnerability commits.

