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
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [panelMaximized, setPanelMaximized] = useState(false);
  const [mfaToggleOn, setMfaToggleOn] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetupPending, setMfaSetupPending] = useState(false);
  const [mfaQrCodeData, setMfaQrCodeData] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [loginMfaRequired, setLoginMfaRequired] = useState(false);

  //token is initialized from localStorage, so we can check for existing token on app load
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
    setMfaCode("");
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
        otp: mfaCode || undefined,
      });

      if (response.data.mfaRequired) {
        setLoginMfaRequired(true);
        setMessage("MFA is enabled. Enter the code from your SafeAuth app.");
        return;
      }

      const jwt = response.data.token;
      localStorage.setItem("authToken", jwt);
      setToken(jwt);
      setMessage("Login successful. JWT stored locally.");
      clearForm();
      setLoginMfaRequired(false);
    } catch (error) {
      setMessage(
        error.response?.data?.error || error.message || "Login failed"
      );
    }
  };

  const handleToggleMfa = async () => {
    if (!email || !password) {
      setMessage("Enter email and password first to manage MFA.");
      return;
    }

    if (mfaToggleOn) {
      setMessage("Disabling MFA...");
      try {
        await api.post("/auth/mfa/disable", { email, password });
        setMfaToggleOn(false);
        setMfaEnabled(false);
        setMfaSetupPending(false);
        setMfaQrCodeData("");
        setMfaCode("");
        setMessage("MFA disabled successfully.");
      } catch (error) {
        setMessage(
          error.response?.data?.error || error.message || "Unable to disable MFA"
        );
      }
      return;
    }

    setMessage("Checking MFA status...");
    try {
      const response = await api.post("/auth/mfa/status", { email, password });
      const enabled = response.data.mfaEnabled;
      setMfaEnabled(enabled);
      setMfaToggleOn(true);
      setMfaSetupPending(!enabled);
      setMfaQrCodeData("");
      setMfaCode("");
      setMessage(
        enabled
          ? "MFA is already enabled for this account."
          : "MFA is disabled. Click Setup MFA to configure it."
      );
    } catch (error) {
      setMessage(
        error.response?.data?.error || error.message || "Unable to check MFA status"
      );
      setMfaToggleOn(false);
    }
  };

  const handleSetupMfa = async () => {
    if (!email || !password) {
      setMessage("Enter email and password first to begin MFA setup.");
      return;
    }

    setMessage("Generating MFA QR code...");
    try {
      const response = await api.post("/auth/mfa/setup", { email, password });
      setMfaQrCodeData(response.data.qrCodeData);
      setMfaSetupPending(false);
      setMfaEnabled(false);
      setMessage("Scan the QR code in SafeAuth and enter the code it generates.");
    } catch (error) {
      setMessage(
        error.response?.data?.error || error.message || "MFA setup failed"
      );
    }
  };

  const handleVerifyMfaSetup = async () => {
    if (!mfaCode) {
      setMessage("Enter the code from SafeAuth to confirm MFA setup.");
      return;
    }

    setMessage("Verifying MFA setup...");
    try {
      const response = await api.post("/auth/mfa/verify-setup", {
        email,
        otp: mfaCode,
      });

      const jwt = response.data.token;
      localStorage.setItem("authToken", jwt);
      setToken(jwt);
      setMfaEnabled(true);
      setMfaToggleOn(true);
      setMfaQrCodeData("");
      setMfaCode("");
      setMessage("MFA setup complete and login successful.");
    } catch (error) {
      setMessage(
        error.response?.data?.error || error.message || "MFA verification failed"
      );
    }
  };

  const handleCancelMfaSetup = () => {
    setMfaQrCodeData("");
    setMfaCode("");
    setMfaSetupPending(true);
    setMessage("MFA setup cancelled. You can rerun setup again.");
  };

  // const handleSendOtp = async (event) => {
  //   event?.preventDefault();
  //   console.log("EMAIL =", email);
  //   console.log("PASSWORD =", password);

  //   setMessage("Sending OTP...");

  //   try {
  //     await api.post("/auth/send-otp", {
  //       email,
  //       password,
  //     });
  //     setOtpSent(true);
  //     setMessage("OTP sent to your email. Enter it below to verify.");
  //   } catch (error) {
  //     setMessage(
  //       error.response?.data?.error || error.message || "Sending OTP failed"
  //     );
  //   }
  // };

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
    setPanelOpen(false);
    setPanelMinimized(false);
    setPanelMaximized(false);
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
      setPanelOpen(true);
      setPanelMinimized(false);
      setPanelMaximized(false);
      setMessage("Users fetched successfully.");
    } catch (error) {
      setUsers([]);
      setPanelOpen(false);
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

        {loginMfaRequired && (
          <div className="otp-section">
            <h3>Enter MFA Code</h3>
            <p>Use the SafeAuth app to get the next one-time code.</p>
            <label>
              Authenticator code
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="Enter 6-digit code"
              />
            </label>
            <div className="auth-actions">
              <button type="button" className="primary" onClick={handleLogin}>
                Verify code
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setLoginMfaRequired(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mfa-section">
          <div className="mfa-toggle-row">
            <span>MFA</span>
            <button
              type="button"
              className={`toggle-button ${mfaToggleOn ? "on" : ""}`}
              onClick={handleToggleMfa}
            >
              {mfaToggleOn ? "On" : "Off"}
            </button>
          </div>

          {mfaToggleOn && mfaEnabled && (
            <p className="mfa-status">MFA is enabled for this account.</p>
          )}

          {mfaToggleOn && !mfaEnabled && !mfaQrCodeData && (
            <div className="mfa-action-row">
              <button type="button" className="secondary" onClick={handleSetupMfa}>
                Setup MFA
              </button>
            </div>
          )}

          {mfaQrCodeData && (
            <div className="mfa-setup-panel">
              <p>Scan this QR code with the SafeAuth app.</p>
              <img className="mfa-qr" src={mfaQrCodeData} alt="MFA setup QR code" />
              <label>
                Authenticator code
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="Enter code from SafeAuth"
                />
              </label>
              <div className="auth-actions">
                <button type="button" className="primary" onClick={handleVerifyMfaSetup}>
                  Verify MFA code
                </button>
                <button type="button" className="secondary" onClick={handleCancelMfaSetup}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

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

      {panelOpen && users.length > 0 && (
        <div className={`users-panel ${panelMaximized ? "maximized" : ""} ${panelMinimized ? "minimized" : ""}`}>
          <div className="users-panel-header">
            <div>
              <h2>Protected Users</h2>
              <p className="users-panel-meta">{users.length} users loaded</p>
            </div>
            <div className="panel-controls">
              <button
                type="button"
                className="panel-button"
                onClick={() => setPanelMinimized((prev) => !prev)}
                aria-label={panelMinimized ? "Restore users panel" : "Minimize users panel"}
              >
                {panelMinimized ? "▢" : "–"}
              </button>
              <button
                type="button"
                className="panel-button"
                onClick={() => {
                  setPanelMaximized((prev) => !prev);
                  if (panelMinimized) setPanelMinimized(false);
                }}
                aria-label={panelMaximized ? "Restore users panel" : "Maximize users panel"}
              >
                {panelMaximized ? "❐" : "☐"}
              </button>
              <button
                type="button"
                className="panel-button close-button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close users panel"
              >
                ×
              </button>
            </div>
          </div>
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
