import { useEffect, useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import "./App.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

function App() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("authToken") || "");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setOtp("");
    setOtpSent(false);
  };

  const handleRegister = async (event) => {
    event?.preventDefault();
    setMessage("Registering...");

    try {
      await api.post("/auth/register", {
        email,
        password,
      });

      setMessage("Registration successful. Sending OTP to your email...");
      
      // Automatically send OTP after registration
      try {
        await api.post("/auth/send-otp", {
          email,
          password,
        });
        setOtpSent(true);
        setMessage("OTP sent to your email. Enter it below to complete registration.");
      } catch (otpError) {
        setMessage(
          otpError.response?.data?.error || otpError.message || "Failed to send OTP. Please try again."
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.error || error.message || "Registration failed"
      );
    }
  };

  const handleLogin = async (event) => {
    event?.preventDefault();
    setMessage("Logging in...");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const jwt = response.data.token;
      localStorage.setItem("authToken", jwt);
      setToken(jwt);
      setMessage("Login successful. JWT stored locally.");
      clearForm();
    } catch (error) {
      setMessage(
        error.response?.data?.error || error.message || "Login failed"
      );
    }
  };

  const handleSendOtp = async (event) => {
    event?.preventDefault();
    console.log("EMAIL =", email);
    console.log("PASSWORD =", password);

    setMessage("Sending OTP...");

    try {
      await api.post("/auth/send-otp", {
        email,
        password,
      });
      setOtpSent(true);
      setMessage("OTP sent to your email. Enter it below to verify.");
    } catch (error) {
      setMessage(
        error.response?.data?.error || error.message || "Sending OTP failed"
      );
    }
  };

  const handleVerifyOtp = async () => {
    setMessage("Verifying OTP...");

    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        otp,
      });
      const jwt = response.data.token;
      localStorage.setItem("authToken", jwt);
      setToken(jwt);
      setMessage("OTP verified successfully. Registration complete!");
      clearForm();
    } catch (error) {
      setMessage(
        error.response?.data?.error || error.message || "OTP verification failed"
      );
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      setMessage("Google login did not return a credential.");
      return;
    }

    setMessage("Verifying Google sign-in...");

    try {
      const response = await api.post("/auth/google", {
        idToken,
      });

      const jwt = response.data.token;
      localStorage.setItem("authToken", jwt);
      setToken(jwt);
      setMessage("Google sign-in successful. JWT stored locally.");
    } catch (error) {
      setMessage(
        error.response?.data?.error || error.message || "Google login failed"
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setToken("");
    setUsers([]);
    setMessage("Logged out.");
  };

  const fetchUsers = async () => {
    if (!token) {
      setMessage("Please login first to fetch users.");
      return;
    }

    try {
      const response = await api.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data || []);
      setMessage("Users fetched successfully.");
    } catch (error) {
      setUsers([]);
      setMessage(
        error.response?.data?.error || error.response?.data || error.message ||
          "Failed to load users"
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>AuthVault</h1>
          <p>Register, login, or sign in with Google to access protected user data.</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "tab active" : "tab"}
            onClick={() => setMode("register")}
          >
            Signup
          </button>
        </div>

        <form className="auth-form" onSubmit={mode === "login" ? handleLogin : handleRegister}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <div className="auth-actions">
            <button type="submit" className="primary">
              {mode === "login" ? "Login" : "Create account"}
            </button>
            <button type="button" className="secondary" onClick={fetchUsers}>
              Fetch protected users
            </button>
          </div>
        </form>

        {mode === "register" && otpSent && (
          <div className="otp-section">
            <h3>Verify Your Email</h3>
            <p>An OTP has been sent to {email}. Enter it below to complete registration.</p>
            <label>
              OTP
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                required
              />
            </label>
            <div className="auth-actions">
              <button type="button" className="primary" onClick={handleVerifyOtp}>
                Verify OTP
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setOtpSent(false);
                  clearForm();
                }}
              >
                Back to Register
              </button>
            </div>
          </div>
        )}

        <div className="google-login-row">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setMessage("Google sign-in failed.")} />
        </div>

        <div className="auth-footer">
          <p>{message}</p>
          {token && (
            <div className="token-row">
              <span>JWT stored locally.</span>
              <button type="button" className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {users.length > 0 && (
        <div className="users-panel">
          <h2>Protected Users</h2>
          <ul>
            {users.map((user) => (
              <li key={user.id}>{user.email}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
