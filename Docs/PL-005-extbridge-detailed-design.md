# ExtBridge 詳細設計書

## 文書管理情報

| 項目 | 内容 |
|------|------|
| 文書ID | PL-005 |
| バージョン | 1.0 |
| 作成日 | 2025年5月16日 |
| 最終更新日 | 2025年5月16日 |
| 作成者 | Windsurf+SWE-1 |
| 承認者 | Windsurf+PM-1 |
| 承認日 | 2025年5月16日 |
| ステータス | レビュー中 |

## 1. はじめに

### 1.1 目的
本ドキュメントは、ExtBridgeシステムの詳細設計を定義することを目的とします。基本設計を基に、システムの実装に必要な詳細な仕様を定めます。

### 1.2 範囲
本ドキュメントでは、以下の項目について記述します。

- システム構成の詳細
- コンポーネント設計
- データベース設計
- API設計
- 画面設計
- バッチ処理設計
- エラーハンドリング
- セキュリティ設計

### 1.3 用語定義
| 用語 | 説明 |
|------|------|
| ExtBridge | 本システムの名称 |
| Extic | 本システムで使用する基盤技術 |
| クラウドサービス | 本システムで管理対象とする外部サービス |

## 2. システム構成

### 2.1 システム構成図
```
[クライアント層] ---- [Webサーバー] ---- [アプリケーションサーバー] ---- [データベースサーバー]
      |                    |                        |                              |
      |                    |                        |
[APIゲートウェイ]    [ロードバランサー]    [キャッシュサーバー]         [バックアップサーバー]
```

### 2.2 ハードウェア構成
| サーバー種別 | スペック | 台数 | 役割 |
|------------|---------|------|------|
| Webサーバー | 4vCPU, 8GBメモリ | 2 | 静的コンテンツ配信、リバースプロキシ |
| APサーバー | 8vCPU, 16GBメモリ | 4 | アプリケーション処理 |
| DBサーバー | 16vCPU, 64GBメモリ | 2 | データベース（マスター・スレーブ構成） |
| キャッシュサーバー | 4vCPU, 16GBメモリ | 2 | セッション・キャッシュ管理 |

### 2.3 ソフトウェア構成
| カテゴリ | 製品/バージョン | 用途 |
|---------|----------------|------|
| OS | Ubuntu 22.04 LTS | サーバーOS |
| Webサーバー | Nginx 1.23.0 | リバースプロキシ、ロードバランサー |
| アプリケーション | Node.js 18.x | バックエンド処理 |
| データベース | PostgreSQL 14 | データ永続化 |
| キャッシュ | Redis 7.0 | セッション管理、キャッシュ |
| コンテナ | Docker 24.0 | アプリケーションコンテナ化 |
| オーケストレーション | Kubernetes 1.27 | コンテナオーケストレーション |

## 3. コンポーネント設計

### 3.1 コンポーネント構成図
```
+-------------------+
|   ユーザーインターフェイス   |
+-------------------+
         |
         v
+-------------------+
|     APIゲートウェイ    |
+-------------------+
         |
         v
+-------------------+
|   認証・認可コンポーネント |
+-------------------+
         |
         v
+-------------------+
|   ビジネスロジック層   |
+-------------------+
         |
         v
+-------------------+
|   データアクセス層     |
+-------------------+
         |
         v
+-------------------+
|   データストア       |
+-------------------+
```

### 3.2 コンポーネント詳細

#### 3.2.1 ユーザーインターフェイス

- **役割**: ユーザーとのインタラクションを担当
- **技術スタック**: React 18, TypeScript, Material-UI
- **主な機能**: 
  - レスポンシブデザイン
  - プログレッシブウェブアプリケーション（PWA）対応
  - オフライン機能

#### 3.2.2 APIゲートウェイ

- **役割**: リクエストのルーティング、負荷分散、SSL終端
- **技術スタック**: Nginx, Kong Gateway
- **主な機能**:
  - レートリミッティング
  - リクエスト/レスポンス変換
  - キャッシュ制御

#### 3.2.3 認証・認可コンポーネント

- **役割**: ユーザー認証と認可を管理
- **技術スタック**: Keycloak, OAuth 2.0, OpenID Connect
- **主な機能**:
  - マルチファクタ認証
  - シングルサインオン（SSO）
  - ロールベースのアクセス制御（RBAC）

## 4. データベース設計

### 4.1 ER図
```
+---------------+       +----------------+       +---------------+
|   ユーザー    |1    *|  サービス利用権限 |*    1| クラウドサービス|
+---------------+       +----------------+       +---------------+
| PK id        |<----->| PK id         |<----->| PK id        |
|   username   |       | FK user_id    |       |   name       |
|   email      |       | FK service_id |       |   provider   |
|   password   |       |   role        |       |   api_docs   |
|   created_at |       |   granted_at  |       |   created_at |
+---------------+       +----------------+       +---------------+
```

### 4.2 テーブル定義

#### 4.2.1 ユーザーテーブル（users）
| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PK | ユーザー一意識別子 |
| username | VARCHAR(50) | NOT NULL, UNIQUE | ユーザー名 |
| email | VARCHAR(255) | NOT NULL, UNIQUE | メールアドレス |
| password_hash | VARCHAR(255) | NOT NULL | パスワードハッシュ |
| is_active | BOOLEAN | DEFAULT true | アカウント有効フラグ |
| last_login | TIMESTAMP | NULLABLE | 最終ログイン日時 |
| created_at | TIMESTAMP | NOT NULL | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | 更新日時 |

#### 4.2.2 クラウドサービステーブル（cloud_services）
| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PK | サービス一意識別子 |
| name | VARCHAR(100) | NOT NULL | サービス名 |
| provider | VARCHAR(100) | NOT NULL | プロバイダー名 |
| description | TEXT | NULLABLE | サービスの説明 |
| api_docs_url | VARCHAR(255) | NULLABLE | APIドキュメントURL |
| is_active | BOOLEAN | DEFAULT true | 有効フラグ |
| created_at | TIMESTAMP | NOT NULL | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | 更新日時 |

#### 4.2.3 サービス利用権限テーブル（service_permissions）
| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PK | 権限一意識別子 |
| user_id | UUID | FK(users.id) | ユーザーID |
| service_id | UUID | FK(cloud_services.id) | サービスID |
| role | VARCHAR(50) | NOT NULL | ロール（admin, user, viewer） |
| granted_at | TIMESTAMP | NOT NULL | 権限付与日時 |
| expires_at | TIMESTAMP | NULLABLE | 有効期限 |
| created_at | TIMESTAMP | NOT NULL | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | 更新日時 |

## 5. API設計

### 5.1 認証API

#### 5.1.1 ログイン
```
POST /api/v1/auth/login

リクエストボディ:
{
  "username": "user1",
  "password": "password123"
}

レスポンス（成功時）:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "def50200e5b2..."
}
```

#### 5.1.2 トークンリフレッシュ
```
POST /api/v1/auth/refresh

リクエストボディ:
{
  "refresh_token": "def50200e5b2..."
}

レスポンス（成功時）:
{
  "access_token": "new_access_token_here...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 5.2 ユーザー管理API

#### 5.2.1 ユーザー一覧取得
```
GET /api/v1/users
認証: 必須（管理者権限）

クエリパラメータ:
- page: ページ番号（デフォルト: 1）
- limit: 1ページあたりの件数（デフォルト: 20）
- search: 検索文字列（ユーザー名、メールアドレス）

レスポンス:
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "user1",
      "email": "user1@example.com",
      "is_active": true,
      "last_login": "2025-03-25T15:30:00Z"
    },
    ...
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

#### 5.2.2 ユーザー詳細取得
```
GET /api/v1/users/{userId}
認証: 必須（本人または管理者権限）

パスパラメータ:
- userId: ユーザーID

レスポンス（成功時）:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "user1",
  "email": "user1@example.com",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-03-25T15:30:00Z",
  "last_login": "2025-03-25T15:30:00Z"
}
```

## 6. 画面設計

### 6.1 ログイン画面
- **URL**: /login
- **認証**: 不要
- **レイアウト**: シンプルな中央配置フォーム
- **要素**:
  - ユーザー名入力フィールド
  - パスワード入力フィールド
  - ログインボタン
  - 「パスワードを忘れた場合」リンク
  - エラーメッセージ表示領域

### 6.2 ダッシュボード
- **URL**: /dashboard
- **認証**: 必須
- **レイアウト**: サイドバー付きレイアウト
- **要素**:
  - ヘッダー（ユーザー情報、通知、ログアウト）
  - サイドナビゲーションメニュー
  - メインコンテンツエリア
    - ようこそメッセージ
    - クイックアクセス（よく使う機能）
    - 最近のアクティビティ
    - システムステータス

## 7. バッチ処理設計

### 7.1 ユーザーアクティビティログ集計バッチ
- **目的**: ユーザーのアクティビティログを集計し、レポートを生成
- **スケジュール**: 毎日午前2時（UTC）
- **処理フロー**:
  1. 前日分のアクティビティログを取得
  2. ユーザーごと、サービスごとに集計
  3. 集計結果をデータベースに保存
  4. 管理者向けにサマリーメールを送信

### 7.2 一時ファイル削除バッチ
- **目的**: 一時ディレクトリ内の古いファイルを削除
- **スケジュール**: 毎時0分
- **処理フロー**:
  1. 一時ディレクトリをスキャン
  2. 24時間以上経過したファイルを特定
  3. 該当ファイルを削除
  4. 削除ログを記録

## 8. エラーハンドリング

### 8.1 エラーコード体系
| コード | カテゴリ | 説明 |
|------|---------|------|
| 1xxx | 入力エラー | リクエストの形式が不正 |
| 2xxx | 認証エラー | 認証・認可関連のエラー |
| 3xxx | リソースエラー | リソースが存在しない、またはアクセス不可 |
| 4xxx | ビジネスロジックエラー | ビジネスルール違反 |
| 5xxx | サーバーエラー | サーバー内部エラー |

### 8.2 主なエラーレスポンス例
```
{
  "error": {
    "code": 2401,
    "message": "認証に失敗しました。ユーザー名またはパスワードが正しくありません。",
    "details": {
      "field": "password",
      "reason": "invalid_credentials"
    },
    "timestamp": "2025-03-26T10:30:45Z",
    "request_id": "req_1234567890abcdef"
  }
}
```

## 9. セキュリティ設計

### 9.1 認証・認可
- パスワードポリシー
  - 最小長: 12文字
  - 大文字・小文字・数字・記号の組み合わせ必須
  - 90日ごとのパスワード変更推奨
  - 過去5回分のパスワード再利用禁止

- セッション管理
  - セッションタイムアウト: 30分（操作なし）
  - トークン有効期間: アクセストークン1時間、リフレッシュトークン7日
  - トークン無効化: ログアウト時、パスワード変更時

### 9.2 データ保護
- 暗号化
  - 通信: TLS 1.3（必須）
  - 保存データ: AES-256 で暗号化
  - パスワード: bcrypt（ソルト+ストレッチング）

- マスク化
  - ログ出力時の機微情報マスク化
  - 画面表示時のクレジットカード番号マスク化

## 10. パフォーマンス設計

### 10.1 キャッシュ戦略
- クライアントサイドキャッシュ
  - 静的リソース: 1年間（バージョニングによるキャッシュバスティング）
  - APIレスポンス: Cache-Controlヘッダーによる制御

- サーバーサイドキャッシュ
  - Redisによるセッションストア
  - 頻繁にアクセスされるマスターデータのキャッシュ（TTL: 1時間）
  - クエリキャッシュ（TTL: 5分）

### 10.2 データベース最適化
- インデックス設計
  - 外部キー、検索条件、ソート条件に使用されるカラムにインデックスを設定
  - 複合インデックスのカラム順序を最適化

- パーティショニング
  - 大規模テーブルは作成日時でパーティショニング
  - パーティション間のデータ移動を容易にするためのアーカイブ戦略を策定

## 11. 監視・運用設計

### 11.1 ログ設計
- アクセスログ
  - フォーマット: JSONL（1リクエスト1行）
  - 保持期間: 30日（圧縮アーカイブは1年間）
  - 監視対象: エラーレート、レイテンシー、スループット

- アプリケーションログ
  - レベル: DEBUG, INFO, WARN, ERROR, FATAL
  - コンテキスト: リクエストID、ユーザーID、セッションID
  - アラート閾値: ERROR以上が1分間に10件以上

### 11.2 メトリクス
- インフラメトリクス
  - CPU使用率（アラート閾値: 80%超過）
  - メモリ使用率（アラート閾値: 85%超過）
  - ディスク使用率（アラート閾値: 90%超過）

- アプリケーションメトリクス
  - リクエストレート
  - エラーレート（アラート閾値: 1%超過）
  - パーセンタイルレイテンシー（p50, p90, p99）

## 12. テスト設計

### 12.1 テストカテゴリ
1. 単体テスト（Unit Test）
   - カバレッジ目標: 80%以上
   - モックを使用した独立したテスト

2. 統合テスト（Integration Test）
   - APIエンドポイントのテスト
   - データベース連携テスト

3. E2Eテスト（End-to-End Test）
   - ユーザーシナリオに沿ったテスト
   - UI操作を含むフローテスト

### 12.2 テストデータ戦略
- テストデータ生成ツールの活用
- 本番データの匿名化（マスキング）
- テストデータのバージョン管理

## 13. デプロイメント設計

### 13.1 環境構成
| 環境 | 目的 | URL | データベース |
|------|------|-----|------------|
| 開発 | 開発者向け | dev.extbridge.example.com | 開発用DB |
| ステージング | 結合テスト | staging.extbridge.example.com | ステージングDB |
| 本番 | 本番環境 | extbridge.example.com | 本番DB |

### 13.2 デプロイフロー
1. 開発者がfeatureブランチで作業
2. プルリクエストを作成し、コードレビュー
3. マージ後、CI/CDパイプラインが自動実行
4. テストが成功したらステージング環境に自動デプロイ
5. ステージング環境での検証後、本番環境にデプロイ（手動承認）

## 14. マイグレーション計画

### 14.1 データ移行
- 移行対象データの洗い出し
- データクレンジング（重複、不正データの除去）
- 移行スクリプトの作成とテスト
- 本番移行時のダウンタイム最小化のための戦略

### 14.2 リリース戦略
- ブルーグリーンデプロイメント
- カナリアリリース（段階的ロールアウト）
- 機能フラグによる機能の有効/無効切り替え

## 15. 付録

### 15.1 用語集
| 用語 | 説明 |
|------|------|
| OAuth 2.0 | 認可フレームワーク |
| JWT | JSON Web Token |
| RBAC | ロールベースアクセス制御 |
| SLA | サービスレベルアグリーメント |

### 15.2 参考資料
- ExtBridge 基本設計書（PL-004）
- ExtBridge 要件定義書（PL-002）
- RESTful API設計ガイドライン
- セキュリティコーディングガイドライン
