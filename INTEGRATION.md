# Встраивание burndown (PMP-157)

Если копировал прошлую версию, удали `src/components/reports/useLoad.js`: он больше не нужен.

1. Из архива скопируй в корень фронта новые файлы: папки `tests/` и `src/api`, `src/utils`, `src/components/reports`.
2. Две существующие правки (`BoardTab.jsx`, `tabList.js`) примени патчем из корня фронта:
   `git apply --check existing-files.patch && git apply existing-files.patch`
   Так не затрутся чужие изменения. Если патч не применился, внеси эти несколько строк вручную.
3. `App.jsx`:

```jsx
import ReportsTab from "./components/reports/ReportsTab";
// было: <Route path="reports" element={<ProjectComingSoonPage tab="reports" />} />
<Route path="reports/:view?" element={<ReportsTab />} />
```
Импорт `ProjectComingSoonPage` оставь: он нужен вкладке Files.

4. `npm install recharts`, закоммить `package.json` и `package-lock.json`.
5. Пока нет бэка: `VITE_MOCK_BURNDOWN=true` в `.env.local`, перезапусти `npm run dev`.
   Пример всегда один (points, working), переключатели график не меняют.
   Списки спринтов настоящие, нужен хотя бы один начатый спринт.
   Когда бэк будет готов, удали `burndownSample.js` и ветку `USE_SAMPLE`.
6. `npm run lint && npm test && npm run build`

По CLAUDE.md стоит также коротко описать раздел Reports в CLAUDE.md.
