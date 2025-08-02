import keycloak from '../js/keycloak';

function Login() {
  const handleLogin = () => {
    keycloak.login();
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
