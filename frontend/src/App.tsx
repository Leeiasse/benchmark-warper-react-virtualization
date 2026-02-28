import { Routes, Route } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { BenchmarkPage } from "./BenchmarkPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/bench/:library" element={<BenchmarkPage />} />
    </Routes>
  );
}
