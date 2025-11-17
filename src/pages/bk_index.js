import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login attempted with:", { username, password });
    // You can add your login logic here
    alert(`Logged in as: ${username}`);
    // Reset form
    setUsername("");
    setPassword("");
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="card shadow-lg" style={{ width: "400px" }}>
        <div className="card-body p-5">
          <h1 className="text-center mb-4">ToDo Loo!📋</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Username:
              </label>
              <input
                type="text"
                id="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password:
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 mb-3">
              Log In
            </button>
            <div className="text-center">
              Don&apos;t have an account? <a href="#">Register here.</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
