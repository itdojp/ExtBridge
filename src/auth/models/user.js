/**
 * ExtBridge - ユーザーモデル
 * システムのユーザー情報を管理します
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // 基本情報
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  
  // SAML認証情報
  samlId: {
    type: String,
    unique: true,
    sparse: true // nullの場合は一意性制約を適用しない
  },
  
  // ユーザー属性
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  department: {
    type: String,
    trim: true
  },
  
  // 連携サービス情報
  connectedServices: [{
    service: {
      type: String,
      required: true,
      enum: ['github', 'figma', 'slack']
    },
    serviceUserId: {
      type: String,
      required: true
    },
    accessToken: {
      type: String
    },
    refreshToken: {
      type: String
    },
    tokenExpiry: {
      type: Date
    },
    scopes: [{
      type: String
    }],
    connectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // システム管理情報
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新時に updatedAt を自動更新
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ユーザーが特定のサービスに接続しているかを確認するメソッド
UserSchema.methods.isConnectedTo = function(serviceName) {
  return this.connectedServices.some(service => service.service === serviceName);
};

// サービス接続情報を取得するメソッド
UserSchema.methods.getServiceConnection = function(serviceName) {
  return this.connectedServices.find(service => service.service === serviceName);
};

module.exports = mongoose.model('User', UserSchema);
