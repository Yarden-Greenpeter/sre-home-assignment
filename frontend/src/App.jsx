// frontend/src/App.jsx
import { useState } from 'react';
import axios from 'axios';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/login', {
        email,
        password,
      });
      setToken(res.data.token);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h2>Login</h2>
      {token ? (
        <div>
          <p>Login successful! Your token:</p>
          <code>{token}</code>
        </div>
      ) : (
        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="email">Email:</label><br />
            <input
              id="email"
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '300px', padding: '8px' }}
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <label htmlFor="password">Password:</label><br />
            <input
              id="password"
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '300px', padding: '8px' }}
            />
          </div>
          <button style={{ marginTop: 20, padding: '8px 16px' }} type="submit">
            Login
          </button>
        </form>
      )}
      {error && <p style={{ color: 'red', marginTop: 20 }}>{error}</p>}
    </div>
  );
}

export default App;

