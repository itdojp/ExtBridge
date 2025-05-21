# ExtBridge システム運用マニュアル

## 1. 概要
本書はExtBridgeシステムの運用手順、特にMongoDBの起動・停止方法について記載します。

## 2. MongoDBの運用

### 2.1. サービスとしてMongoDBを起動する場合
```powershell
net start MongoDB
```

### 2.2. 手動でMongoDBを起動する場合
```powershell
mongod --dbpath C:\data\db
```
※データディレクトリは適宜変更してください。

### 2.3. 起動確認
```powershell
mongo
show dbs
```
で接続とデータベース一覧表示を確認。

### 2.4. 停止方法
```powershell
net stop MongoDB
```
または、mongodプロセスを終了。
