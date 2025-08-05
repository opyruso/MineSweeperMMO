const KeycloakCtor = window.Keycloak;

const keycloak = new KeycloakCtor({
  url: window.CONFIG['auth-url'],
  realm: window.CONFIG['auth-realm'],
  clientId: window.CONFIG['auth-client-id'],
});

let refreshInterval;

export async function init() {
  const authenticated = await keycloak
    .init({ onLoad: 'check-sso', checkLoginIframe: false })
    .catch(() => false);
  if (authenticated) {
    startTokenRefresh();
  }
  setupFetchInterceptor();
  return authenticated;
}

function startTokenRefresh() {
  refreshInterval = setInterval(() => {
    keycloak.updateToken(60).catch(() => {
      keycloak.clearToken();
    });
  }, 10000);
}

function setupFetchInterceptor() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (url, options = {}) => {
    if (keycloak.token) {
      try {
        await keycloak.updateToken(60);
      } catch {
        keycloak.clearToken();
      }
    }
    const headers = new Headers(options.headers || {});
    if (keycloak.token) {
      headers.set('Authorization', `Bearer ${keycloak.token}`);
    }
    return originalFetch(url, { ...options, headers });
  };
}

export const login = (options) => keycloak.login(options);
export const logout = (options) => {
  clearInterval(refreshInterval);
  return keycloak.logout(options);
};

export const hasRealmRole = (role) =>
  keycloak && keycloak.hasRealmRole && keycloak.hasRealmRole(role);
export const hasResourceRole = (role, resource) =>
  keycloak &&
  keycloak.hasResourceRole &&
  keycloak.hasResourceRole(role, resource);

export const getUserId = () => keycloak.tokenParsed?.sub;

export default keycloak;
