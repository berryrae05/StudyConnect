import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import Navbar from "../components/layout/Navbar";

export default function DashboardPage() {
    const user = JSON.parse(localStorage.getItem("user"));
    
  return (
      <Navbar activeLink="dashboard" user={user} />
  );
}
