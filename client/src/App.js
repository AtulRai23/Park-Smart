import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import HomePage from "./Pages/HomePage";
import { AuthContext } from "./Context/AuthContext";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />
       <Route
  path="/login"
  element={user ? <Navigate to="/" replace /> : <LoginPage />}
/>
      </Routes>
    </Router>
  );
}

export default App;
