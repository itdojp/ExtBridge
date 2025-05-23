# PL-004 ExtBridge 基本設計書

| 文書情報 | |
|------|------|
| 文書名 | ExtBridge 基本設計書 |
| 文書ID | PL-004 |
| バージョン | 1.0 |
| 作成日 | 2025年5月16日 |
| 最終更新日 | 2025年5月16日 |
| 作成者 | ExtBridge プロジェクトチーム |
| 承認者 | |
| ステータス | 作成中 |
| 関連文書 | PL-001 システム設計書, PL-002 要件定義書, PL-003 システム化計画書 |

## 1. はじめに

### 1.1 目的
本基本設計書は、ExtBridgeシステムの基本設計を定義し、詳細設計・開発の指針とすることを目的とする。

### 1.2 対象範囲
- システム全体構成
- 主要機能の設計
- システム間連携方式
- セキュリティ設計の基本方針

## 2. システム構成

### 2.1 システム全体構成図
```
[ユーザー] 
    | 
[ExtBridge ポータル] ←→ [認証基盤(Extic)]
    |            |           |
    |            |           |
[GitHub]  [Figma]  [JetBrains]  [Adobe]  [その他SAML対応サービス]
```

### 2.2 ハードウェア構成

#### 2.2.1 本番環境
- アプリケーションサーバー: 4vCPU, 16GB RAM, 100GB SSD × 2台（冗長化）
- データベースサーバー: 8vCPU, 32GB RAM, 500GB SSD（マスター・スレーブ構成）
- ロードバランサー: 1台
- バックアップサーバー: 1台

#### 2.2.2 ステージング環境
- アプリケーションサーバー: 2vCPU, 8GB RAM, 50GB SSD × 1台
- データベースサーバー: 4vCPU, 16GB RAM, 100GB SSD × 1台

### 2.3 ソフトウェア構成

#### 2.3.1 ミドルウェア
- OS: Ubuntu 22.04 LTS
- Webサーバー: Nginx 1.23
- アプリケーションサーバー: Node.js 18.x
- データベース: PostgreSQL 14
- キャッシュ: Redis 7.0
- コンテナ: Docker 24.0, Kubernetes 1.27

#### 2.3.2 主要ライブラリ・フレームワーク
- バックエンド: Express.js 4.18
- フロントエンド: React 18, TypeScript 5.0
- ORM: Prisma 5.0
- 認証: Passport.js, SAML2-js
- テスト: Jest, Cypress

## 3. 機能設計

### 3.1 認証・認可機能

#### 3.1.1 シングルサインオン
- SAML 2.0 IdP機能
- OIDC 1.0 サポート
- セッション管理（有効期間: 8時間）
- シングルログアウト

#### 3.1.2 多要素認証
- TOTP（Google Authenticatorなど）
- メール認証
- バックアップコード

### 3.2 プロビジョニング機能

#### 3.2.1 ユーザー同期
- SCIM 2.0 プロトコル実装
- 15分間隔での増分同期
- フル同期（24時間毎）
- エラーログと通知

### 3.3 サービス連携機能

#### 3.3.1 GitHub連携
- Organization連携設定
- チーム同期機能
- リポジトリアクセス制御
- トークンベース認証

#### 3.3.2 Figma連携
- Organization管理
- チームメンバーシップ同期
- シート管理連携

#### 3.3.3 JetBrains連携
- License Vault連携
- ライセンス割り当て管理
- 使用状況モニタリング

#### 3.3.4 Adobe連携
- Admin Console連携
- ライセンス管理
- ストレージ管理

### 3.4 管理機能

#### 3.4.1 ダッシュボード
- ライセンス使用状況
- システムステータス
- 最近のアクティビティ
- アラート表示

#### 3.4.2 ユーザー管理
- ユーザー一覧・検索
- ユーザー詳細表示
- アカウントロック
- パスワードリセット

#### 3.4.3 グループ管理
- グループ作成・編集・削除
- メンバー管理
- ロール割り当て

#### 3.4.4 ログ管理
- 認証ログ
- 操作ログ
- 監査ログ
- エラーログ

## 4. データベース設計

### 4.1 主要テーブル

#### 4.1.1 ユーザー管理
- users: ユーザー基本情報
- user_attributes: ユーザー属性
- groups: グループ情報
- group_members: グループメンバーシップ
- roles: ロール定義
- user_roles: ユーザーロール関連

#### 4.1.2 認証・認可
- sessions: セッション管理
- mfa_devices: 多要素認証デバイス
- api_tokens: APIトークン管理
- permissions: 権限定義

#### 4.1.3 サービス連携
- services: 連携サービス定義
- service_configs: サービス設定
- service_accounts: サービスアカウント
- service_permissions: サービス権限

#### 4.1.4 監査・ログ
- audit_logs: 監査ログ
- access_logs: アクセスログ
- error_logs: エラーログ

## 5. API設計

### 5.1 認証API
- `POST /api/v1/auth/login` - ログイン
- `POST /api/v1/auth/logout` - ログアウト
- `POST /api/v1/auth/mfa/verify` - 多要素認証
- `POST /api/v1/auth/refresh` - トークンリフレッシュ

### 5.2 ユーザー管理API
- `GET /api/v1/users` - ユーザー一覧取得
- `GET /api/v1/users/{id}` - ユーザー詳細取得
- `POST /api/v1/users` - ユーザー作成
- `PUT /api/v1/users/{id}` - ユーザー更新
- `DELETE /api/v1/users/{id}` - ユーザー削除

### 5.3 グループ管理API
- `GET /api/v1/groups` - グループ一覧取得
- `POST /api/v1/groups` - グループ作成
- `PUT /api/v1/groups/{id}` - グループ更新
- `DELETE /api/v1/groups/{id}` - グループ削除
- `POST /api/v1/groups/{id}/members` - メンバー追加
- `DELETE /api/v1/groups/{id}/members/{userId}` - メンバー削除

### 5.4 サービス連携API
- `GET /api/v1/services` - サービス一覧取得
- `POST /api/v1/services/{serviceId}/sync` - 手動同期実行
- `GET /api/v1/services/{serviceId}/status` - 同期ステータス確認

## 6. セキュリティ設計

### 6.1 認証・認可
- 多要素認証の強制
- パスワードポリシー（最小12文字、大文字・小文字・数字・記号必須）
- アカウントロック（5回連続失敗で30分ロック）
- ロールベースのアクセス制御（RBAC）

### 6.2 データ保護
- 通信の暗号化（TLS 1.3）
- 保存データの暗号化（AES-256）
- パスワードのハッシュ化（Argon2id）
- 機密情報のキー管理（AWS KMS）

### 6.3 監査・ロギング
- 全操作の監査ログ記録
- ログの改ざん防止（ハッシュチェーン）
- 90日間のログ保持
- リアルタイムアラート

## 7. 運用設計

### 7.1 バックアップ戦略
- データベース: 日次フルバックアップ + 1時間毎の差分
- 設定ファイル: 変更時バックアップ
- バックアップの暗号化とオフサイト保管
- 月次バックアップテスト

### 7.2 監視体制
- リソース監視（CPU、メモリ、ディスク）
- アプリケーション監視（レスポンスタイム、エラーレート）
- ビジネスKPI監視（アクティブユーザー数、認証成功率）
- 24/7 監視体制

### 7.3 障害対応
- 障害レベル定義（P1〜P4）
- エスカレーションフロー
- インシデント管理プロセス
- 事後検証（PDCA）

## 8. 移行計画

### 8.1 データ移行
- ユーザーアカウント移行
- グループ情報移行
- アクセス権限移行
- 移行前後のデータ整合性検証

### 8.2 切り替え手順
1. テスト環境での検証
2. 本番環境へのデプロイ
3. データ移行
4. 動作確認
5. 本番切り替え
6. モニタリング

## 9. テスト計画

### 9.1 テスト項目
- 単体テスト（UT）
- 結合テスト（IT）
- システムテスト（ST）
- 負荷テスト（LT）
- セキュリティテスト（ST）
- ユーザー受入テスト（UAT）

### 9.2 テスト環境
- テスト環境構築手順
- テストデータ作成ガイド
- テストケース管理方法
- 不具合管理フロー

## 10. 今後の予定

### 10.1 マイルストーン
- 基本設計完了: 2025年5月31日
- 詳細設計完了: 2025年6月30日
- 開発完了: 2025年9月30日
- テスト完了: 2025年10月31日
- 本番リリース: 2025年11月15日

### 10.2 課題・リスク
- 外部サービスAPIの変更リスク
- パフォーマンス要件達成の検証
- セキュリティ要件の充足確認
- 移行作業の複雑さ

## 11. 承認

| 役割 | 氏名 | 承認日 | 承認署名 |
|------|------|--------|----------|
| プロジェクトマネージャー | | | |
| セキュリティ責任者 | | | |
| システムアーキテクト | | | |
| インフラ責任者 | | | |

## 12. 改訂履歴

| バージョン | 改訂日 | 改訂内容 | 改訂者 |
|------------|--------|----------|--------|
| 1.0 | 2025/05/16 | 初版作成 | プロジェクトチーム |
