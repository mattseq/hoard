import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch ('/api/auth', {
      method: 'GET',
      credentials: 'include',
    }).then(res => {
      if (res.ok) {
        setLoggedIn(true);
        console.log(res);
      } else {
        setLoggedIn(false);
      }
    })
    .catch(() => setLoggedIn(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      console.log('Login successful!');
      setLoggedIn(true);
    } else {
      console.log('Login failed. Please check your credentials.');
      setLoggedIn(false);
    }
  }

  return (
    <>
      {loggedIn ? (
        <div>
          <h1>Welcome to the Hoard App!</h1>
          <p>You are logged in.</p>
        </div>
      ) : (
        <div className="login-container">
          <h2>Login</h2>
          <form className='login-form' onSubmit={handleLogin}>
            <input type="text" id="username" name="username" onChange={e => setUsername(e.target.value)} placeholder='Username' />
            <input type="password" id="password" name="password" onChange={e => setPassword(e.target.value)} placeholder='Password' />
            <button type="submit">Login</button>
          </form>
        </div>
      )}      
    </>
  )
}

export default App
