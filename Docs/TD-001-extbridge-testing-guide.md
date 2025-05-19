# ExtBridge テストガイド

文書番号: TD-001  
バージョン: 1.0  
作成日: 2025-05-17  
作成者: Windsurf+SWE-1  
承認者: Windsurf+PM-1  
ステータス: 承認済み

## 1. 概要

このドキュメントはExtBridgeアプリケーションのテスト方法について説明します。テストには以下の2種類があります：

1. **モックテスト**: 実際のExticサーバーに接続せずに行うテスト
2. **実環境テスト**: 実際のExticサーバーに接続して行うテスト

このガイドでは、両方のテスト方法について詳細に説明します。

## 2. テスト環境のセットアップ

### 2.1 前提条件

- Node.js 18.x以上
- npm 9.x以上
- MongoDB（ローカル環境またはMongoDBアトラス）
- Git

### 2.2 リポジトリのクローン

```bash
git clone https://github.com/your-org/extbridge.git
cd extbridge
```

### 2.3 依存関係のインストール

```bash
npm install
```

### 2.4 環境変数の設定

`.env.test`ファイルを作成し、以下の環境変数を設定します：

```
# 共通設定
NODE_ENV=test
PORT=3001
JWT_SECRET=test-jwt-secret

# データベース設定
MONGODB_URI=mongodb://localhost:27017/extbridge_test

# モックテスト用設定
USE_MOCK=true
```

## 3. モックテスト（Exticサーバーに接続しないテスト）

### 3.1 モックテストの概要

モックテストでは、実際のExticサーバーに接続せずにテストを行います。これにより、以下のメリットがあります：

- インターネット接続がなくてもテスト可能
- テスト環境の準備が簡単
- テスト実行が高速
- 外部サービスの状態に依存しない一貫したテスト結果

### 3.2 モックテストの実行方法

```bash
# すべてのテストを実行
npm test

# 特定のディレクトリのテストを実行
npm test -- tests/unit/auth

# 特定のファイルのテストを実行
npm test -- tests/unit/extic/exticClient.test.js
```

### 3.3 モックの仕組み

モックテストでは、以下のコンポーネントをモック化しています：

1. **Exticサーバーの応答**: `tests/mocks/exticMock.js`でnockを使用してHTTPリクエストをモック化
2. **データベース**: `mongodb-memory-server`を使用してインメモリMongoDBを実行
3. **外部サービス（GitHub, Figma, Slack）**: 各サービスのクライアントをモック化

### 3.4 モックテストのカスタマイズ

モックレスポンスをカスタマイズする場合は、`tests/mocks/exticMock.js`ファイルを編集します：

```javascript
// モックユーザーデータを変更する例
function mockUserData() {
  return {
    id: "custom-user-id",
    email: "custom-user@example.com",
    // その他のフィールド
  };
}
```

## 4. 実環境テスト（実際のExticサーバーに接続するテスト）

### 4.1 実環境テストの概要

実環境テストでは、実際のExticサーバーに接続してテストを行います。これにより、以下のメリットがあります：

- 実際の環境での動作を確認できる
- 外部サービスとの連携を実際にテストできる
- エンドツーエンドのフローを検証できる

### 4.2 実環境テストの前提条件

1. **Exticサーバーへのアクセス権限**
   - テスト用のExticアカウント
   - APIアクセストークン

2. **環境変数の設定**
   `.env.test.real`ファイルを作成し、以下の環境変数を設定します：

   ```
   # 共通設定
   NODE_ENV=test
   PORT=3001
   JWT_SECRET=test-jwt-secret

   # データベース設定
   MONGODB_URI=mongodb://localhost:27017/extbridge_test_real

   # Extic設定
   USE_MOCK=false
   EXTIC_BASE_URL=https://extic.real-server.com
   EXTIC_API_KEY=your-api-key

   # SAML設定
   SAML_ENTRY_POINT=https://extic.real-server.com/saml2/idp/SSOService.php
   SAML_ISSUER=extic-saml-real
   SAML_CALLBACK_URL=http://localhost:3001/auth/saml/callback

   # サービス接続設定
   GITHUB_CLIENT_ID=real-github-client-id
   GITHUB_CLIENT_SECRET=real-github-client-secret
   GITHUB_CALLBACK_URL=http://localhost:3001/api/services/github/callback

   FIGMA_CLIENT_ID=real-figma-client-id
   FIGMA_CLIENT_SECRET=real-figma-client-secret
   FIGMA_CALLBACK_URL=http://localhost:3001/api/services/figma/callback

   SLACK_CLIENT_ID=real-slack-client-id
   SLACK_CLIENT_SECRET=real-slack-client-secret
   SLACK_CALLBACK_URL=http://localhost:3001/api/services/slack/callback
   ```

### 4.3 実環境テストの実行方法

```bash
# 実環境テスト用の環境変数を読み込む
export $(cat .env.test.real | xargs)

# 実環境テストを実行
npm run test:real
```

実環境テスト用のスクリプトは`package.json`に以下のように定義されています：

```json
{
  "scripts": {
    "test:real": "cross-env USE_MOCK=false jest --config jest.config.real.js"
  }
}
```

### 4.4 実環境テスト用のテストファイル

実環境テスト用のテストファイルは、`tests/real`ディレクトリに配置します。例えば：

- `tests/real/auth/samlAuth.test.js`: 実際のSAML認証をテスト
- `tests/real/extic/exticClient.test.js`: 実際のExtic APIをテスト

### 4.5 実環境テストの注意点

1. **テストデータの管理**
   - テスト用のデータを事前に準備し、テスト後にクリーンアップする
   - テスト用の専用アカウントを使用する

2. **セキュリティ**
   - 実際のAPIキーやシークレットをソースコードにハードコーディングしない
   - `.env.test.real`ファイルをGitにコミットしない（`.gitignore`に追加する）

3. **テスト実行頻度**
   - 実環境テストはリソースを消費するため、必要な場合のみ実行する
   - CI/CDパイプラインでは、重要なマイルストーン（リリース前など）でのみ実行する

## 5. テストカバレッジの確認

テストカバレッジを確認するには、以下のコマンドを実行します：

```bash
npm run test:coverage
```

カバレッジレポートは`coverage`ディレクトリに生成されます。

## 6. テストの自動化

### 6.1 CI/CDパイプラインでのテスト

GitHub Actionsを使用して、プルリクエストやプッシュ時に自動的にテストを実行できます。

`.github/workflows/ci-cd.yml`ファイルに以下のように定義されています：

```yaml
name: ExtBridge CI/CD Pipeline

on:
  push:
    branches: [ main, develop, staging ]
  pull_request:
    branches: [ main, develop, staging ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:4.4
        ports:
          - 27017:27017

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
        MONGODB_URI: mongodb://localhost:27017/extbridge_test
        USE_MOCK: true
    
    - name: Upload test coverage
      uses: codecov/codecov-action@v3
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
```

### 6.2 実環境テストの自動化

実環境テストは、特定のイベント（例：リリースタグの作成）でのみ実行するように設定できます：

```yaml
name: ExtBridge Real Environment Tests

on:
  release:
    types: [created]
  workflow_dispatch:

jobs:
  test-real:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run real environment tests
      run: npm run test:real
      env:
        NODE_ENV: test
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
        MONGODB_URI: ${{ secrets.TEST_MONGODB_URI }}
        USE_MOCK: false
        EXTIC_BASE_URL: ${{ secrets.EXTIC_BASE_URL }}
        EXTIC_API_KEY: ${{ secrets.EXTIC_API_KEY }}
        SAML_ENTRY_POINT: ${{ secrets.SAML_ENTRY_POINT }}
        SAML_ISSUER: ${{ secrets.SAML_ISSUER }}
        SAML_CALLBACK_URL: ${{ secrets.SAML_CALLBACK_URL }}
        GITHUB_CLIENT_ID: ${{ secrets.GITHUB_CLIENT_ID }}
        GITHUB_CLIENT_SECRET: ${{ secrets.GITHUB_CLIENT_SECRET }}
        GITHUB_CALLBACK_URL: ${{ secrets.GITHUB_CALLBACK_URL }}
        FIGMA_CLIENT_ID: ${{ secrets.FIGMA_CLIENT_ID }}
        FIGMA_CLIENT_SECRET: ${{ secrets.FIGMA_CLIENT_SECRET }}
        FIGMA_CALLBACK_URL: ${{ secrets.FIGMA_CALLBACK_URL }}
        SLACK_CLIENT_ID: ${{ secrets.SLACK_CLIENT_ID }}
        SLACK_CLIENT_SECRET: ${{ secrets.SLACK_CLIENT_SECRET }}
        SLACK_CALLBACK_URL: ${{ secrets.SLACK_CALLBACK_URL }}
```

## 7. トラブルシューティング

### 7.1 モックテストの問題

1. **モックが正しく動作しない**
   - `jest.mock`の呼び出しが正しい場所にあるか確認
   - モックの実装が正しいか確認

2. **テストが断続的に失敗する**
   - テスト間の依存関係を確認
   - `beforeEach`と`afterEach`でテスト状態をクリーンアップ

### 7.2 実環境テストの問題

1. **認証エラー**
   - APIキーやシークレットが正しいか確認
   - アクセス権限が適切か確認

2. **ネットワークエラー**
   - Exticサーバーが利用可能か確認
   - ファイアウォールやプロキシの設定を確認

3. **テストタイムアウト**
   - テストのタイムアウト設定を増やす
   - ネットワーク接続の安定性を確認

## 8. 総合テスト計画

### 8.1 テスト戦略

ExtBridgeのテスト戦略は以下の階層で構成されます：

1. **ユニットテスト**
   - 個々の関数やコンポーネントのテスト
   - モックを使用した依存関係の分離
   - 高速なフィードバックループの実現

2. **統合テスト**
   - コンポーネント間の連携テスト
   - 外部サービスとの統合テスト
   - データベース操作のテスト

3. **E2Eテスト**
   - 実際のユーザーフローのテスト
   - UI/UXのテスト
   - パフォーマンステスト

4. **セキュリティテスト**
   - 認証・認可のテスト
   - 脆弱性スキャン
   - セキュリティチェック

### 8.2 テストカバレッジ目標

| カテゴリ | 目標カバレッジ | 優先度 |
|---------|--------------|-------|
| ユニットテスト | 80%以上 | 高 |
| 統合テスト | 70%以上 | 中 |
| E2Eテスト | 50%以上 | 中 |
| セキュリティテスト | 100% | 高 |

### 8.3 テストスコープ

#### 8.3.1 コア機能

- ユーザー認証・認可
- セッション管理
- エラーハンドリング
- ロギング

#### 8.3.2 サービス連携

- GitHub連携
- Figma連携
- Slack連携
- Extic API連携

#### 8.3.3 データ管理

- データベース操作
- キャッシュ戦略
- データ検証

### 8.4 テスト自動化戦略

#### 8.4.1 CI/CDパイプライン

- プルリクエスト時の自動テスト実行
- マージ前の必須チェック
- 自動デプロイフロー

#### 8.4.2 テストデータ管理

- テストデータの自動生成
- テストデータのリセット機能
- テストデータのバージョン管理

#### 8.4.3 パフォーマンステスト

- ロードテストの自動化
- パフォーマンスベンチマーク
- リソース使用量の監視

### 8.5 テスト環境

#### 8.5.1 ローカル環境

- 開発者用の独立したテスト環境
- モックサービスによる依存関係の分離
- 高速なフィードバックループ

#### 8.5.2 ステージング環境

- 本番環境に近い構成
- 統合テスト用
- パフォーマンステスト用

#### 8.5.3 本番環境

- モニタリングとアラート
- カナリアリリース
- A/Bテスト

### 8.6 テストメトリクス

| メトリクス | 目標値 | 測定方法 |
|-----------|--------|----------|
| テストカバレッジ | 80%以上 | Jestカバレッジレポート |
| テスト実行時間 | 10分以内 | CI/CDパイプライン |
| バグ検出率 | 90%以上 | バグトラッキングシステム |
| 回帰バグ数 | 5%以下 | リリースごとのバグ数 |

### 8.7 リスク管理

| リスク | 影響度 | 対策 |
|--------|--------|-------|
| テストの不安定性 | 中 | フレーキーテストの特定と修正 |
| テスト実行時間の増加 | 高 | テストの並列化と最適化 |
| モックと実装の乖離 | 高 | 定期的なモックの見直し |
| テストデータの管理 | 中 | テストデータ管理ツールの導入 |

## 9. ロードマップ

### 第1四半期

- ユニットテストのカバレッジ80%達成
- 主要なユースケースのE2Eテスト実装
- CI/CDパイプラインの構築

### 第2四半期

- 統合テストの拡充
- パフォーマンステストの自動化
- セキュリティテストの導入

### 第3四半期

- テスト実行時間の最適化
- テストデータ管理の改善
- テストレポートの充実

## 10. 参考資料

- [Jest公式ドキュメント](https://jestjs.io/docs/getting-started)
- [Nock公式ドキュメント](https://github.com/nock/nock#readme)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [SuperTest](https://github.com/visionmedia/supertest)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Google Testing Blog](https://testing.googleblog.com/)
