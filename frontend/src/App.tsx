import { useState, useEffect } from 'react'
import './App.css'

function App() {

  interface FileMeta {
    fileId: string;
    originalName: string;
    size: number;
    type: string;
    uploadedAt: string;
    url: string;
  }

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  const [publicFiles, setPublicFiles] = useState<FileMeta[]>([]);
  const [privateFiles, setPrivateFiles] = useState<FileMeta[]>([]);

  useEffect(() => {
    fetch ('/api/auth', {
      method: 'GET',
      credentials: 'include',
    }).then(res => {
      if (res.ok) {
        setLoggedIn(true);
        fetchPublicFiles();
        fetchPrivateFiles();
        console.log(res);
      } else {
        setLoggedIn(false);
        console.log(res)
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
      fetchPublicFiles();
      fetchPrivateFiles();
    } else {
      console.log('Login failed. Please check your credentials.');
      setLoggedIn(false);
    }
  }

  async function fetchPublicFiles() {
    const res = await fetch('/files/public', {
      method: 'GET',
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      console.log('Public files:', data);
      setPublicFiles(data);
    } else {
      console.log('Failed to fetch public files.');
    }
  }
  async function fetchPrivateFiles() {
    const res = await fetch('/files/private', {
      method: 'GET',
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      console.log('Private files:', data);
      setPrivateFiles(data);
    } else {
      console.log('Failed to fetch private files.');
    }
  }

  return (
    <>
      {loggedIn ? (
        <div className="file-page">
          <div className="public-files files-container">
            <h2>Public Files</h2>
            <ul>
              {publicFiles.map(file => (
                <li key={file.fileId}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.originalName} ({(file.size / 1024).toFixed(2)} KB)
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="private-files files-container">
            <h2>Private Files</h2>
            <ul>
              {privateFiles.map(file => (
                <li key={file.fileId}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.originalName} ({(file.size / 1024).toFixed(2)} KB)
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="login-page">
          <div className="login-container">
            <h2>Login</h2>
            <form className='login-form' onSubmit={handleLogin}>
              <input type="text" id="username" name="username" onChange={e => setUsername(e.target.value)} placeholder='Username' />
              <input type="password" id="password" name="password" onChange={e => setPassword(e.target.value)} placeholder='Password' />
              <button type="submit">Login</button>
            </form>
          </div>
        </div>
      )}      
    </>
  )
}

export default App
