import keycloak from '../keycloak';

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
