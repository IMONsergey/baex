# Design QA

Дата завершения: 2026-11-03.

Final result: **passed**

Проверка относится к самостоятельной reference edition на React. Это результат проверки перечисленных состояний, а не заявление о попиксельном совпадении всех кадров или о тестировании всех браузеров. Исходный Nuxt-код не входит в приложение; длинные тексты пересказаны, формы и аналитика референса не подключены.

## Среда и метод сравнения

Источник: [rejouice.com](https://www.rejouice.com/), включая Work, About, Services, Contact и страницы проектов. Реализация проверялась в локальном Vite-превью в Chrome.

- Desktop: CSS viewport 1363 × 936, DPR 1. Область документа при системной полосе прокрутки имеет ширину 1348px. Cloud screenshot возвращал JPEG 1348 × 926; отдельные снимки без полосы были 1363 × 936. Для совместных desktop-сравнений обе стороны приведены к 1363 × 936. Это нормализация снимка, а не измерение пиксельной ошибки.
- Mobile: iframe viewport 390 × 844 в том же Chrome, оба сайта в одинаковых рамках. Это проверка responsive-верстки; реальное устройство и touch/OS-эмуляция не использовались.
- Финальные первые экраны сняты после завершения вступительной анимации. Для Work List выбран ICOMAT; для Tensor открыт первый экран; для Venture выполнен переход из панели моделей.
- Сравнивались общий кадр и отдельные читаемые области. Включены промежуточные снимки, чтобы можно было проследить исправления. Первый мобильный source PNG был снят во время анимации; итоговая оценка использует только `source-home-mobile-settled.jpg`.
- Видео, курсор и часы могут находиться в разных кадрах/моментах. Они не оценивались автоматическим pixel-diff. Геометрия дополнительно проверялась через DOM и computed styles.

Все пути ниже указаны относительно корня репозитория.

## Финальные пары

| Страница / состояние | Источник | Реализация | Совместное сравнение |
|---|---|---|---|
| Home, desktop, scroll 0 | `docs/evidence/source-home-desktop.jpg` | `docs/evidence/implementation-home-desktop-final.jpg` | [Home desktop](docs/evidence/home-desktop-comparison-final.jpg) |
| Home, mobile, scroll 0, анимация завершена | `docs/evidence/source-home-mobile-settled.jpg` | `docs/evidence/implementation-home-mobile-settled.jpg` | [Home mobile](docs/evidence/home-mobile-comparison-settled.jpg) |
| Work, List, ICOMAT | `docs/evidence/source-work-list.jpg` | `docs/evidence/implementation-work-list-final.jpg` | [Work List](docs/evidence/work-list-comparison-final.jpg) |
| Tensor, первый экран | `docs/evidence/source-tensor-desktop.jpg` | `docs/evidence/implementation-tensor-desktop-final.jpg` | [Tensor](docs/evidence/tensor-comparison-final.jpg) |
| About, первый экран | `docs/evidence/source-about-desktop-final.jpg` | `docs/evidence/implementation-about-desktop-final.jpg` | [About](docs/evidence/about-comparison-final.jpg) |
| Services, первый экран | `docs/evidence/source-services-desktop.jpg` | `docs/evidence/implementation-services-desktop-final.jpg` | [Services](docs/evidence/services-comparison-final.jpg) |
| Services, Venture anchor | `docs/evidence/source-venture-desktop-final.jpg` | `docs/evidence/implementation-venture-desktop-final.jpg` | [Venture](docs/evidence/venture-comparison-final.jpg) |
| Contact, первый экран | `docs/evidence/source-contact-desktop-final.jpg` | `docs/evidence/implementation-contact-desktop-final.jpg` | [Contact](docs/evidence/contact-comparison-final.jpg) |

Читаемые фрагменты: [mobile header](docs/evidence/mobile-header-detail.jpg), [Work List / preview](docs/evidence/work-list-detail.jpg), [Contact / type](docs/evidence/contact-type-detail.jpg). Фрагменты сохранены в масштабе одного CSS-пикселя на пиксель изображения после описанной нормализации. Полные кадры выше сохраняют окружающий контекст.

Дополнительные состояния: [reel](docs/evidence/implementation-reel-desktop.jpg), [mobile menu](docs/evidence/implementation-mobile-menu.jpg), [ICOMAT mobile](docs/evidence/implementation-icomat-mobile.jpg).

## Пять поверхностей соответствия

| Поверхность | Проверка и результат |
|---|---|
| Шрифты и типографика | Локальные Suisse Intl Light / Regular. Крупный знак использует геометрию исходного SVG. В Contact измерены одинаковые 58.6908px / 63.4204px, letter-spacing −1.24px; блок обеих версий занимает y=615.546875…742.390625. В Venture font-size 388.073px и letter-spacing −24.6px совпадают с источником; высота строки отличается менее чем на 0.1px. |
| Сетка, интервалы и адаптив | Сохранены крупный первый экран, поля 40px desktop / 10px mobile, полноэкранные проекты, две модели Services, мобильная последовательность карточек. Work preview имеет ширину 211px, высоту 147px при расчетных 146.51px для этого viewport. После исправления якорь Venture дает y=90px против 89.59px у источника. |
| Цвета и контраст | Проверены черные и белые секции, инверсия навигации, белый активный проект и приглушенные соседние названия. В Work List computed opacity активной ссылки 1, остальных .45. |
| Изображения и видео | Сохранены reference media и пропорции. Все runtime media локальные. Проверены cover/crop главной и выбранных кейсов, полноэкранный ролик, мобильные обложки. Проверка хешей охватывает 412 файлов, не только видимые примеры. |
| Контент и его плотность | Сохранены структура, 19 проектов, роли и галереи; длинные тексты являются редакционными пересказами. Tensor возвращен к однострочной подписи, Services к двухстрочному intro. About остается трехстрочным, Contact двухстрочным при desktop viewport. Отзывы оформлены как пересказ, без выдачи за дословные цитаты. |

## Исправления по результатам проверки

| Уровень | Наблюдение | Исправление и повторная проверка |
|---|---|---|
| P1 | Шторка перехода могла остаться поверх новой страницы. Пример: `implementation-work-desktop.jpg`. | Сброшен абсолютный `y` перед использованием `yPercent`. После refresh восстановлена целевая прокрутка. Повторно проверены переходы Work → Tensor и между About, Services, Contact, Legal; контент доступен, шторка уходит за viewport. |
| P2 | На мобильной Home отображался маленький логотип вместо вводной строки; нижний текст располагался выше источника. | Header меняет строку на знак после 100px прокрутки; поправлены нижний отступ и ширина колонок. История: `home-mobile-comparison-01.jpg` → `home-mobile-comparison-settled.jpg`. |
| P2 | В Work List все названия становились белыми из-за inline opacity от анимации. | Анимация перенесена на `li`, состояние активной ссылки осталось в CSS. Повторно проверены computed opacity, клавиатура и переход в кейс. История: `work-list-comparison-01.jpg` → `work-list-comparison-final.jpg`. |
| P2 | Миниатюра List имела фиксированную высоту 121px и неверную пропорцию. | Высота вычисляется по пропорции полноэкранной сцены. Финальный кадр и DOM дают ширину 211px, высоту 147px. |
| P2 | Подпись Tensor занимала две строки вместо одной. | Сокращен самостоятельный текст, сохранена плотность исходного первого экрана. История: `tensor-comparison.jpg` → `tensor-comparison-final.jpg`. |
| P2 | Крупный текст editorial-страниц был увеличен до 5.1vw. | Исправлены размер, интерлиньяж, letter-spacing и отступ первой строки. Пересняты About, Services и Contact; приведены измерения выше. |
| P2 | Venture имел лишние 88px сверху, более широкое слово и смещение якоря на 20px. | Убрано верхнее поле только у Venture, уточнен letter-spacing и отступ якоря. Mobile overrides сохранены. История: `venture-comparison.jpg` → `venture-comparison-final.jpg`. |
| P2 | Intro Services занимал лишнюю строку, первая видимая строка capabilities еще была скрыта анимацией. | Сокращен текст до двух строк и скорректирована граница запуска editorial reveal. Итог: `services-comparison-final.jpg`. |

Открытых наблюдаемых P0/P1/P2 в перечисленных проверенных состояниях нет. Мелкие различия остаются: несколько пикселей в мобильном положении знака, антиалиасинг, положение системной полосы прокрутки и момент появления отдельных строк у нижнего края viewport. Это P3 и не мешает работе или последующей адаптации.

## Интерактивная проверка

| Сценарий | Результат |
|---|---|
| Home: стрелка к ролику | Переход к медиа-блоку выполнен. |
| Полный showreel | Открывается по нажатию; duration 91.008s, readyState 4, currentTime увеличивается. После явного действия пользователя воспроизведение со звуком. |
| Закрытие reel | Escape закрывает окно после exit-анимации; фокус возвращается на кнопку запуска; прокрутка страницы восстанавливается. |
| Work: Full / List | Переключение и изменение состояния кнопок работают. Escape возвращает Full. |
| Work: клавиатура и переход | Down меняет выбранный проект; выбор Tensor открывает правильный маршрут, scrollY=0. |
| Мобильная навигация | Меню открывается, ссылки работают; Work → ICOMAT → Back проверено. |
| Services: Venture | Якорь прокручивает к секции под закрепленной панелью; итоговый top=90px. |
| Services: mobile metrics | Close / Details меняют видимость и `aria-expanded`. |
| About | Проверены intro, раскрытие блоков при прокрутке, принципы и Awards. |
| Contact | Страница открывается; часы обновляются; контакты представлены ссылками. |
| Footer newsletter | Локальная валидация работает; сообщение сообщает, что рассылка не подключена. Внешней отправки нет. |
| Legal | Открывается собственная страница информации о reference edition, без чужого договора. |
| Переполнение и медиа | В проверенных desktop/mobile состояниях горизонтального переполнения нет; `.media.has-error` не обнаружены. |
| Консоль | Ошибок приложения в просмотренном журнале нет. Отдельно исключены сообщения browser extension; см. `docs/evidence/browser-console.json`. |

Это ручная проверка основных сценариев, а не автоматизированный end-to-end suite. Все 19 галерей целиком вручную не прокручивались. Hover-эффекты реализованы, но полное покрытие каждого pointer-состояния в cloud browser не заявляется. Reduced motion реализован и проверен по коду; OS-эмуляция и физические Safari/iOS/Android устройства не тестировались.

## Технические проверки

Последние команды после финальных изменений кода:

```bash
npm run check
npm run build
```

Обе завершились с кодом 0. Результаты:

- TypeScript: passed.
- Контент: 25 маршрутов, 19 проектов, 23 элемента Work, 203 элемента галерей, 55 внутренних ссылок.
- 338 media references, 323 уникальных используемых content assets; пропущенных ссылок нет.
- Проверены хеши 412 media-файлов, 250 140 547 байт; badFiles и missingReferences пусты.
- Runtime CMS dependencies: 0.
- Production: 25 отдельных HTML-входов для известных маршрутов. Временные iframe QA-страницы убраны из public и отсутствуют в dist.
- Основной JS: 601.39 kB, gzip 182.56 kB по отчету Vite. Страницы загружаются отдельными chunks.
- Файлов больше 100 MB нет; самый большой файл, полный reel, занимает 25 065 715 байт.

После первой сборки обнаружено ограничение GitHub-коннектора: тело одного запроса не может превышать 16 MiB. Два MP4 хранятся в Git пятью частями по максимум 8 MiB и автоматически собираются `scripts/prepare-media.mjs` при установке, запуске и сборке. Это только упаковка для передачи; исходные SHA-256 всех 412 медиа остаются прежними. Восстановление обеих отсутствующих MP4 проверено, затем `npm run check` и `npm run build` выполнены повторно. В production остаются обычные MP4 по прежним URL.

Итоговые значения также записаны в [docs/validation-result.json](docs/validation-result.json).

## Границы этой версии

Сайт еще содержит бренд, проекты и публичные контакты референса. Адаптация под BAEV описана в [docs/baev-adaptation.md](docs/baev-adaptation.md), но не выдается за выполненную. Работа выполнена как редактируемая основа, без CMS и чужой аналитики. Публичный deploy и подключение домена не выполнялись.

Два недоступных editor-local blob-ресурса исходного Connect Homes не включены в активную галерею; точные записи находятся в `docs/source-gaps.json`. Источники, размеры и хеши остальных медиа записаны в provenance-файлах. Поддержка кириллицы потребует замены Light-начертания при адаптации BAEV.

Final result: **passed**
