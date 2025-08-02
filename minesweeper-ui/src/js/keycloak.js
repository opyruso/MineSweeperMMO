import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'minesweeper',
  clientId: 'minesweeperui-client',
});

export default keycloak;
