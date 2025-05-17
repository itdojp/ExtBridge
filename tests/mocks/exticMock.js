/**
 * ExtBridge - Exticサーバーのモック
 * 
 * このモジュールはExticサーバーとの通信をモックするためのものです。
 * テスト環境でExticサーバーに実際に接続せずにテストを行うことができます。
 */

const nock = require('nock');

// ExticサーバーのベースURL
const EXTIC_BASE_URL = 'https://extic.example.com';

/**
 * Exticサーバーのモックをセットアップする
 */
function setupExticMock() {
  // SAML IdPエンドポイントのモック
  nock(EXTIC_BASE_URL)
    .persist()
    .post('/saml2/idp/SSOService.php')
    .reply(200, generateSamlResponse());
  
  // SAML メタデータのモック
  nock(EXTIC_BASE_URL)
    .persist()
    .get('/saml2/idp/metadata.php')
    .reply(200, generateSamlMetadata());
  
  // Extic APIのモック - ユーザー情報
  nock(EXTIC_BASE_URL)
    .persist()
    .get('/api/v1/users/me')
    .reply(function(uri, requestBody) {
      const authHeader = this.req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return [401, { error: 'Unauthorized' }];
      }
      return [200, mockUserData()];
    });
  
  // Extic APIのモック - 契約情報
  nock(EXTIC_BASE_URL)
    .persist()
    .get('/api/v1/contracts')
    .reply(function(uri, requestBody) {
      const authHeader = this.req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return [401, { error: 'Unauthorized' }];
      }
      return [200, mockContractsData()];
    });
  
  // Extic APIのモック - サービス情報
  nock(EXTIC_BASE_URL)
    .persist()
    .get('/api/v1/services')
    .reply(function(uri, requestBody) {
      const authHeader = this.req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return [401, { error: 'Unauthorized' }];
      }
      return [200, mockServicesData()];
    });
  
  console.log('Exticサーバーのモックをセットアップしました');
}

/**
 * Exticサーバーのモックをクリーンアップする
 */
function cleanupExticMock() {
  nock.cleanAll();
  console.log('Exticサーバーのモックをクリーンアップしました');
}

/**
 * モックSAMLレスポンスを生成する
 */
function generateSamlResponse() {
  return `
    <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_mock_response_id" Version="2.0" IssueInstant="${new Date().toISOString()}" Destination="https://extbridge-xxxxx.run.app/auth/saml/callback">
      <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_mock_assertion_id" IssueInstant="${new Date().toISOString()}" Version="2.0">
        <saml:Issuer>extic-saml</saml:Issuer>
        <saml:Subject>
          <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">test-user@example.com</saml:NameID>
        </saml:Subject>
        <saml:AttributeStatement>
          <saml:Attribute Name="email">
            <saml:AttributeValue>test-user@example.com</saml:AttributeValue>
          </saml:Attribute>
          <saml:Attribute Name="firstName">
            <saml:AttributeValue>Test</saml:AttributeValue>
          </saml:Attribute>
          <saml:Attribute Name="lastName">
            <saml:AttributeValue>User</saml:AttributeValue>
          </saml:Attribute>
        </saml:AttributeStatement>
      </saml:Assertion>
    </samlp:Response>
  `;
}

/**
 * モックSAMLメタデータを生成する
 */
function generateSamlMetadata() {
  return `
    <md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="extic-saml">
      <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:KeyDescriptor use="signing">
          <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
            <ds:X509Data>
              <ds:X509Certificate>MIIC8DCCAdigAwIBAgIQF...</ds:X509Certificate>
            </ds:X509Data>
          </ds:KeyInfo>
        </md:KeyDescriptor>
        <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
        <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://extic.example.com/saml2/idp/SSOService.php"/>
      </md:IDPSSODescriptor>
    </md:EntityDescriptor>
  `;
}

/**
 * モックユーザーデータを生成する
 */
function mockUserData() {
  return {
    id: "user-123",
    email: "test-user@example.com",
    firstName: "Test",
    lastName: "User",
    company: "Test Company",
    role: "user",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-05-17T00:00:00.000Z"
  };
}

/**
 * モック契約データを生成する
 */
function mockContractsData() {
  return {
    contracts: [
      {
        id: "contract-1",
        name: "GitHub Enterprise",
        provider: "GitHub",
        type: "Enterprise",
        status: "active",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        cost: 1000,
        currency: "USD",
        billingCycle: "monthly",
        autoRenew: true
      },
      {
        id: "contract-2",
        name: "Figma Organization",
        provider: "Figma",
        type: "Organization",
        status: "active",
        startDate: "2025-02-01",
        endDate: "2026-01-31",
        cost: 45,
        currency: "USD",
        billingCycle: "monthly",
        autoRenew: true
      },
      {
        id: "contract-3",
        name: "Slack Business+",
        provider: "Slack",
        type: "Business+",
        status: "active",
        startDate: "2025-03-01",
        endDate: "2026-02-28",
        cost: 12.50,
        currency: "USD",
        billingCycle: "monthly",
        autoRenew: true
      }
    ],
    total: 3,
    page: 1,
    limit: 10
  };
}

/**
 * モックサービスデータを生成する
 */
function mockServicesData() {
  return {
    services: [
      {
        id: "service-1",
        name: "GitHub",
        description: "GitHub is a web-based hosting service for version control using Git.",
        category: "Development",
        website: "https://github.com",
        logoUrl: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
      },
      {
        id: "service-2",
        name: "Figma",
        description: "Figma is a vector graphics editor and prototyping tool.",
        category: "Design",
        website: "https://figma.com",
        logoUrl: "https://cdn.sanity.io/images/599r6htc/localized/46a76c802176eb17b04e12108de7e7e0f3736dc6-1024x1024.png"
      },
      {
        id: "service-3",
        name: "Slack",
        description: "Slack is a messaging program designed for business.",
        category: "Communication",
        website: "https://slack.com",
        logoUrl: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png"
      }
    ],
    total: 3,
    page: 1,
    limit: 10
  };
}

module.exports = {
  setupExticMock,
  cleanupExticMock,
  EXTIC_BASE_URL
};
