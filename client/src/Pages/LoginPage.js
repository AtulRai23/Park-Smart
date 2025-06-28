import React, { useContext } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login }  = useContext(AuthContext);
  const navigate   = useNavigate();

  const handleLogin = async (cred) => {
    try {
      await axios.post(
        "http://localhost:5000/auth/google",
        { token: cred.credential },
        { withCredentials: true }
      );
      login();            
      navigate("/");     
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-300">
      <div className="card w-[95%] max-w-md text-center">
        <h1 className="text-6xl font-bold mb-8">
          <span className="text-brand">Park&nbsp;Smart</span>
        </h1>

        <GoogleLogin
          onSuccess={handleLogin}
          onError={() => alert("Google login failed")}
          shape="pill"
          width="280"
        />

        <p className="text-xs text-gray-500 mt-6">
          One-tap Google sign-in, no passwords needed.
        </p>
      </div>
    </div>
  );
}
