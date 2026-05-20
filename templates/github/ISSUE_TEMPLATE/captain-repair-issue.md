name: "🛠️ Captain OS: Repair & Task Spine Issue"
description: "Создание новой задачи или регистрация дефекта с разметкой Splash Radius для мета-ОС."
title: "[REPAIR-YYYYMMDD-NAME]: Название задачи"
labels: ["repair-spine", "captain-os"]
body:
  - type: markdown
    attributes:
      value: |
        ## 📋 Регистрация задачи в Task Spine
        Заполните этот шаблон для инициации сессии разработки под управлением Captain OS.
  
  - type: input
    id: repair_id
    attributes:
      label: "Идентификатор задачи (REPAIR-ID)"
      placeholder: "Например: REPAIR-20260520-FIX-NAVIGATION"
    validations:
      required: true

  - type: textarea
    id: problem_description
    attributes:
      label: "Описание задачи / Проблемы"
      description: "Что именно нужно сделать или какой баг исправить?"
      placeholder: "Подробное описание задачи..."
    validations:
      required: true

  - type: textarea
    id: splash_radius
    attributes:
      label: "Оценка Splash & Blast Radius"
      description: "Какие файлы планируется изменить (NEW/MODIFY) и что может пострадать косвенно?"
      placeholder: |
        * **Splash Radius (Изменения)**:
          - [NEW] -
          - [MODIFY] - 
        * **Blast Radius (Косвенные риски)**:
          -
    validations:
      required: true

  - type: textarea
    id: verification_plan
    attributes:
      label: "План верификации (Verification Plan)"
      description: "Как мы докажем, что задача решена на 100%?"
      placeholder: |
        * **Автоматические тесты**: (какие команды запускать)
        * **Ручная проверка**: (пошаговый сценарий)
    validations:
      required: true
