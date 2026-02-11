import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Tables from "./pages/Tables.jsx";
import Upload from "./pages/Upload.jsx";
import Update from "./pages/Update.jsx";
import UpdateTable from "./pages/UpdateTable.jsx";
import Delete from "./pages/Delete.jsx";
import Edit from "./pages/Edit.jsx";
import EditTable from "./pages/EditTable.jsx";
import History from "./pages/History.jsx";
import HistoryDetail from "./pages/HistoryDetail.jsx";
import TrashCan from "./pages/TrashCan.jsx";
import Settings from "./pages/Settings.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Export from "./pages/Export.jsx";
import Facturas from "./pages/Facturas.jsx";
import VarEnv from "./pages/EnvVar.jsx";
import EnvVarHistory from "./pages/EnvVarHistory.jsx";
import DeleteEnvVar from "./pages/DeleteEnvVar.jsx";
import MetricHistory from "./pages/MetricHistory.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



const App = () => {
  return (
    <HashRouter>
      <div className="bg-[#2A3746] min-h-screen w-full ">
        <Routes>
          <Route path="*" element={<Home />} />
          <Route path="/Tables" element={<Tables />} />
          <Route path="/Upload" element={<Upload />} />
          <Route path="/Update" element={<Update />} />
          <Route path="/UpdateTable" element={<UpdateTable />} />
          <Route path="/Delete" element={<Delete />} />
          <Route path="/Edit" element={<Edit />} />
          <Route path="/EditTable" element={<EditTable />} />
          <Route path="/History" element={<History />} />
          <Route path="/HistoryDetail" element={<HistoryDetail />} />
          <Route path="/TrashCan" element={<TrashCan />} />
          <Route path="/Settings" element={<Settings />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Export" element={<Export />} />
          <Route path="/Facturas" element={<Facturas />} />
          <Route path="/EnvVar" element={<VarEnv />} />
          <Route path="/EnvVarHistory" element={<EnvVarHistory />} />
          <Route path="/DeleteEnvVar" element={<DeleteEnvVar />} />
          <Route path="/MetricHistory" element={<MetricHistory />} />
          <Route path="/AuditLog" element={<AuditLog />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
