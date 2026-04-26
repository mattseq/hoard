import { useState, useEffect } from "react";
import "./App.css";
import FileDropZone from "./FileDropZone";

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
    fetch("/api/auth", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          setLoggedIn(true);
          fetchPublicFiles();
          fetchPrivateFiles();
          console.log(res);
        } else {
          setLoggedIn(false);
          console.log(res);
        }
      })
      .catch(() => setLoggedIn(false));
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();

    const submitter = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;

    const action = submitter?.value;
    const endpoint = action === "signup" ? "/api/signup" : "/api/login";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      setLoggedIn(true);
      fetchPublicFiles();
      fetchPrivateFiles();
    } else {
      setLoggedIn(false);
      const error = await res.json();
      alert(error.message);
    }
  }

  async function fetchPublicFiles() {
    const res = await fetch("/files/public", {
      method: "GET",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Public files:", data);
      setPublicFiles(data);
    } else {
      console.log("Failed to fetch public files.");
    }
  }
  async function fetchPrivateFiles() {
    const res = await fetch("/files/private", {
      method: "GET",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Private files:", data);
      setPrivateFiles(data);
    } else {
      console.log("Failed to fetch private files.");
    }
  }

  async function publicFileUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    await fetch("/api/upload/public", {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((res) => {
        if (res.ok) {
          console.log("File uploaded successfully!");
          fetchPublicFiles();
        } else {
          console.log("File upload failed.");
        }
      })
      .catch(() => {
        console.log("File upload failed.");
      });
  }

  async function privateFileUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    await fetch("/api/upload/private", {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((res) => {
        if (res.ok) {
          console.log("File uploaded successfully!");
          fetchPrivateFiles();
        } else {
          console.log("File upload failed.");
        }
      })
      .catch(() => {
        console.log("File upload failed.");
      });
  }

  async function publicFileDelete(fileId: string) {
    console.log("Deleting public file with ID:", fileId);
    await fetch(`/files/public/${fileId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          console.log("File deleted successfully!");
          fetchPublicFiles();
        } else {
          console.log("File deletion failed.");
        }
      })
      .catch(() => {
        console.log("File deletion failed.");
      });
  }

  async function privateFileDelete(fileId: string) {
    console.log("Deleting file with ID:", fileId);
    await fetch(`/files/private/${fileId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          console.log("File deleted successfully!");
          fetchPrivateFiles();
        } else {
          console.log("File deletion failed.");
        }
      })
      .catch(() => {
        console.log("File deletion failed.");
      });
  }

  function convertBytes(size: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  return (
    <>
      {loggedIn ? (
        <div className="file-page">
          <FileDropZone
            onFileUpload={publicFileUpload}
            className="public-files files-container"
          >
            <h2>Public Files</h2>
            <ul>
              {publicFiles.map((file) => (
                <li key={file.fileId}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.originalName} ({convertBytes(file.size)})
                  </a>
                  <button
                    className="delete-button"
                    onClick={() => publicFileDelete(file.fileId)}
                  >
                    <img
                      className="delete-icon"
                      src="https://img.icons8.com/?size=100&id=99961&format=png&color=FFFFFF"
                      alt="delete button"
                    />
                  </button>
                </li>
              ))}
            </ul>
            <p className="drop-text">Drag and drop files to upload</p>
          </FileDropZone>
          <FileDropZone
            onFileUpload={privateFileUpload}
            className="private-files files-container"
          >
            <h2>Private Files</h2>
            <ul>
              {privateFiles.map((file) => (
                <li key={file.fileId}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.originalName} ({convertBytes(file.size)})
                  </a>
                  <button
                    className="delete-button"
                    onClick={() => privateFileDelete(file.fileId)}
                  >
                    <img
                      className="delete-icon"
                      src="https://img.icons8.com/?size=100&id=99961&format=png&color=FFFFFF"
                      alt="delete button"
                    />
                  </button>
                </li>
              ))}
            </ul>
            <p className="drop-text">Drag and drop files to upload</p>
          </FileDropZone>
        </div>
      ) : (
        <div className="login-page">
          <div className="login-container">
            <h2>Login</h2>
            <form className="login-form" onSubmit={handleAuth}>
              <input
                type="text"
                id="username"
                name="username"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
              <input
                type="password"
                id="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <button type="submit" value="login">
                Login
              </button>
              <button type="submit" value="signup">
                Sign Up
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
