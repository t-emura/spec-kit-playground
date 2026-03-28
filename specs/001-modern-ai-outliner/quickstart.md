# Quickstart: Modern Thinking Outliner

## 1. Prerequisites
- Node.js 22 LTS
- npm 10+
- SQLite 3

## 2. Install Dependencies
```bash
npm install
```

## 3. Environment Variables
Create .env files for each app.

apps/api/.env
```env
NODE_ENV=development
PORT=8787
SQLITE_DB_PATH=./data/outliner.db
LOG_LEVEL=info
```

apps/web/.env
```env
VITE_API_BASE_URL=http://localhost:8787
```

## 4. Database Setup
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 5. Start Development Servers
```bash
npm run dev
```

Expected services:
- Web: http://localhost:5173
- API: http://localhost:8787

## 6. Run Tests
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 7. Verify P1 User Story Quickly
1. Webで新規ノートを作成
2. 10項目以上を追加
3. 項目のインデント変更と並べ替え
4. 折りたたみ・展開
5. ページ再読み込み後に状態維持を確認

## 8. Security and Logging Checks
```bash
npm run lint
npm run typecheck
npm run secret-scan
```

## 9. Export Check
1. ノートにメタ情報を2件以上付与
2. エクスポート（json）を実行
3. 出力に metadata セクションが含まれることを確認
