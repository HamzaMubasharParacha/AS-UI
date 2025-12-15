import React, { useState } from "react";
import {login} from "../api/config";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
 
interface LoginPageProps {
  onLoginSuccess: (token: string) => void; // passed from parent
}
 
const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
 
    try {
      const response = await fetch(
        `${login}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );
 
      const data = await response.json();
 
      if (response.ok) {
        console.log("Login response data:", data);
        sessionStorage.setItem("token", data.data.token);
        onLoginSuccess(data.data.token);
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <Box
      sx={{
        height: "100vh",
        background: "radial-gradient(circle at center, #0a0a0a 50%, #000 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper
        sx={{
          p: 4,
          width: 350,
          bgcolor: "#1a1a1a",
          boxShadow: "0px 0px 20px rgba(0,255,65,0.2)",
        }}
      >
        <Typography
          variant="h5"
          sx={{ mb: 3, color: "var(--primary-color)", textAlign: "center" }}
        >
          Anti-Drone System Login
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#888", // default border
                },
                "&:hover fieldset": {
                  borderColor: "var(--primary-color)", // hover border
                },
                "&.Mui-focused fieldset": {
                  borderColor: "var(--primary-color)", // focused border
                },
              },
              "& .MuiInputLabel-root": {
                color: "#888", // label color
                "&.Mui-focused": {
                  color: "var(--primary-color)", // focused label color
                },
              },
              "& .MuiInputBase-input": {
                color: "white", // input text color
              },
            }}
          />
          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#888", // default border
                },
                "&:hover fieldset": {
                  borderColor: "var(--primary-color)", // hover border
                },
                "&.Mui-focused fieldset": {
                  borderColor: "var(--primary-color)", // focused border
                },
              },
              "& .MuiInputLabel-root": {
                color: "#888", // label color
                "&.Mui-focused": {
                  color: "var(--primary-color)", // focused label color
                },
              },
              "& .MuiInputBase-input": {
                color: "white", // input text color
              },
            }}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{
              bgcolor: "var(--primary-color)",
              color: "black",
              fontWeight: "bold",
              "&:hover": { bgcolor: "#00cc33" },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#00cc33" }} />
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};
 
export default LoginPage;