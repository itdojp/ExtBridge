# ExtBridge 開発環境構築手順

## 1. 前提条件
- Node.js, npmインストール済み
- Gitインストール済み
- Windows 10以降

## 2. リポジトリのクローン
```powershell
git clone <リポジトリURL>
cd ExtBridge
```

## 3. 依存パッケージのインストール
```powershell
npm install
```

## 4. MongoDBのインストールと起動

### 4.1. MongoDBインストール確認
```powershell
where mongod
```
なければ[公式サイト](https://www.mongodb.com/try/download/community)からインストール。

### 4.2. サービス起動
```powershell
net start MongoDB
```
または
```powershell
mongod --dbpath C:\data\db
```

### 4.3. 動作確認
```powershell
mongo
show dbs
```

## 5. テスト実行
```powershell
npm test
```
テスト時は `mongodb-memory-server` によりインメモリMongoDBが自動起動されます。
