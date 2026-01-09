import React from "react";
import { Routes, Route } from "react-router-dom";
import InvestorLayout from "./layouts/InvestorLayout";
import AdminLayout from "./layouts/AdminLayout";
import AMCLayout from "./layouts/AMCLayout";
import DistributorLayout from "./layouts/DistributorLayout";
import SEBILayout from "./layouts/SEBILayout";
import GlobalPortal from "./pages/global/GlobalPortal";
// Investor pages
import LandingPage from "./pages/investor/LandingPage";
import Register from "./pages/investor/Register";
import Login from "./pages/investor/Login";
import Dashboard from "./pages/investor/Dashboard";
import Profile from "./pages/investor/Profile";
import FolioDetails from "./pages/investor/FolioDetails";
import Purchase from "./pages/investor/Purchase";
import Redemption from "./pages/investor/Redemption";
import SIPSetup from "./pages/investor/SIPSetup";
import SWPSetup from "./pages/investor/SWPSetup";
import STPSetup from "./pages/investor/STPSetup";
import TransactionHistory from "./pages/investor/TransactionHistory";
import IDCWPreferences from "./pages/investor/IDCWPreferences";
import UnclaimedAmounts from "./pages/investor/UnclaimedAmounts";
import SwitchSetup from "./pages/investor/SwitchSetup";
import CapitalGainsReport from "./pages/investor/CapitalGainsReport";
import ValuationReport from "./pages/investor/ValuationReport";
import CASDownload from "./pages/investor/CASDownload";
import BankMandates from "./pages/investor/BankMandates";
import NomineeManagement from "./pages/investor/NomineeManagement";
import SecuritySettings from "./pages/investor/SecuritySettings";
import MandateManagement from "./pages/investor/MandateManagement";
import ServiceRequests from "./pages/investor/ServiceRequests";
import Notifications from "./pages/investor/Notifications";
import Support from "./pages/investor/Support";
import AssetAllocationChart from "./pages/investor/AssetAllocationChart";
import InvestorComplaints from "./pages/investor/InvestorComplaints";
import DocumentManager from "./pages/investor/DocumentManager";
import RegulatoryDisclosure from "./pages/investor/RegulatoryDisclosure";
import ClientList from "./pages/investor/ClientList";
import ForgotPassword from './pages/investor/ForgotPassword';
import ResetPassword from './pages/investor/ResetPassword';
// Admin pages
import AdminRegister from "./pages/admin/AdminRegister";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Approvals from "./pages/admin/Approvals";
import TransactionsMonitor from "./pages/admin/TransactionsMonitor";
import NAVUpload from "./pages/admin/NAVUpload";
import IDCWManagement from "./pages/admin/IDCWManagement";
import UnclaimedManagement from "./pages/admin/UnclaimedManagement";
import Reconciliation from "./pages/admin/Reconciliation";
import Exceptions from "./pages/admin/Exceptions";
import Reports from "./pages/admin/Reports";
import AuditLogs from "./pages/admin/AuditLogs";
import UserRoleManagement from "./pages/admin/UserRoleManagement";
import AdminAlerts from "./pages/admin/AdminAlerts";
import SystemAlerts from "./pages/admin/SystemAlerts";
import KYCVerification from "./pages/admin/KYCVerification";
import AdminComplaints from "./pages/admin/AdminComplaints";
import MandateApprovals from "./pages/admin/MandateApprovals";
import SystemSettings from "./pages/admin/SystemSettings";
import BatchJobManagement from "./pages/admin/BatchJobManagement";
import UserSessionLogs from "./pages/admin/UserSessionLogs";
import RegulatoryFilings from "./pages/admin/RegulatoryFilings";
import MonitoringLogs from "./pages/admin/MonitoringLogs";

// AMC pages

import AMCLogin from "./pages/amc/AMCLogin";
import AMCRegister from "./pages/amc/AMCRegister";
import AMCDashboard from "./pages/amc/AMCDashboard";
import Fundflows from "./pages/amc/FundFlows";
import NavMonitoring from "./pages/amc/NavMonitoring";
import ComplianceReports from "./pages/amc/ComplianceReports";
import AMCReconciliation from "./pages/amc/AMCReconciliation";
import ProtectedRoute from "./services/ProtectedRoute";
import InvestorProfile from "./pages/amc/InvestorProfile";
import TransactionReports from "./pages/amc/TransactionReports";
import DocumentManagerr from "./pages/amc/DocumentManagerr"; 

// Distributor pages
import DistributorLogin from "./pages/distributor/DistributorLogin";
import DistributorRegister from "./pages/distributor/DistributorRegister";
import DistributorDashboard from "./pages/distributor/DistributorDashboard";
import ClientOnboarding from "./pages/distributor/ClientOnboarding";
import CommissionReports from "./pages/distributor/CommissionReports";
import SalesAnalytics from "./pages/distributor/SalesAnalytics";
import ClientPortfolioView from "./pages/distributor/ClientPortfolioView";

// SEBI (Regulator) pages
import SEBILogin from "./pages/sebi/SEBILogin";
import SEBIDashboard from "./pages/sebi/SEBIDashboard";
import ComplianceMonitoring from "./pages/sebi/ComplianceMonitoring";
import RegulatoryReports from "./pages/sebi/RegulatoryReports";
import AuditTrailAccess from "./pages/sebi/AuditTrailAccess";
import UnclaimedOversight from "./pages/sebi/UnclaimedOversight";
import MaintenanceAlerts from "./pages/global/MaintenanceAlerts";
import AdminDocumentManager from "./pages/admin/AdminDocumentManager";
import AMCRegulatoryDisclosure from "./pages/amc/AMCRegulatoryDisclosure";
import SEBITransactionReports from "./pages/sebi/SEBITransactionReports";
import FolioAccountDetails from "./pages/sebi/FolioAccountDetails";
export default function App() {
  return (
    <Routes>
      {/* Public Landing */}
      {/* <Route path="/" element={<GlobalPortal />} /> */}
      <Route path="/" element={<LandingPage />} />
      
      <Route path="register" element={<Register />} />
      <Route path="login" element={<Login />} />
      <Route path="/maintenance" element={<MaintenanceAlerts />} />
      {/* Investor Routes */}
      <Route element={<InvestorLayout />}>
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="folio/:id" element={<ProtectedRoute><FolioDetails /></ProtectedRoute>} />
        <Route path="purchase" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
        <Route path="redemption" element={<ProtectedRoute><Redemption /></ProtectedRoute>} />
        <Route path="sip" element={<ProtectedRoute><SIPSetup /></ProtectedRoute>} />
        <Route path="swp" element={<ProtectedRoute><SWPSetup /></ProtectedRoute>} />
        <Route path="stp" element={<ProtectedRoute><STPSetup /></ProtectedRoute>} />
        <Route path="transactions" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
        <Route path="switch" element={<ProtectedRoute><SwitchSetup /></ProtectedRoute>} />
        <Route path="unclaimed" element={<ProtectedRoute><UnclaimedAmounts/></ProtectedRoute>} />
        <Route path="idcw" element={<ProtectedRoute><IDCWPreferences /></ProtectedRoute>} />
        <Route path="reports/capital-gains" element={<ProtectedRoute><CapitalGainsReport /></ProtectedRoute>} />
        <Route path="reports/valuation" element={<ProtectedRoute><ValuationReport /></ProtectedRoute>} />
        <Route path="reports/cas" element={<ProtectedRoute><CASDownload /></ProtectedRoute>} />
        <Route path="profile/banks" element={<ProtectedRoute><BankMandates /></ProtectedRoute>} />
        <Route path="profile/nominees" element={<ProtectedRoute><NomineeManagement /></ProtectedRoute>} />
        <Route path="profile/security" element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />
        <Route path="mandates" element={<ProtectedRoute><MandateManagement /></ProtectedRoute>} />
        <Route path="service-requests" element={<ProtectedRoute><ServiceRequests /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="analytics/allocation" element={<ProtectedRoute><AssetAllocationChart /></ProtectedRoute>} />
        <Route path="complaints" element={<ProtectedRoute><InvestorComplaints /></ProtectedRoute>} />
        <Route path="profile/documents" element={<ProtectedRoute><DocumentManager /></ProtectedRoute>} />
        <Route path="disclosures" element={<RegulatoryDisclosure />} />
        <Route path="clients" element={<ProtectedRoute><ClientList /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />


      </Route>

          
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route path="admindashboard" element={<AdminDashboard />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="transactions" element={<TransactionsMonitor />} />
        <Route path="nav" element={<NAVUpload />} />
        <Route path="idcw" element={<IDCWManagement />} />
        <Route path="unclaimed" element={<UnclaimedManagement />} />
        <Route path="recon" element={<Reconciliation />} />
        <Route path="exceptions" element={<Exceptions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="users" element={<UserRoleManagement />} />
        <Route path="alerts" element={<SystemAlerts />} />
        <Route path="admin-alerts" element={<AdminAlerts />} />
        <Route path="documents" element={<AdminDocumentManager />} />
        <Route path="maintenance" element={<MaintenanceAlerts />} />
        <Route path="kyc-verification" element={<KYCVerification />} />
        <Route path="complaints" element={<AdminComplaints />} />
        <Route path="mandate-approvals" element={<MandateApprovals />} />
        <Route path="system-settings" element={<SystemSettings />} />
        <Route path="batch-jobs" element={<BatchJobManagement />} />
        <Route path="user-sessions" element={<UserSessionLogs />} />
        <Route path="regulatory-filings" element={<RegulatoryFilings />} />
        <Route path="monitoring-logs" element={<MonitoringLogs />} />
      </Route>


      {/* AMC Auth */}
      <Route path="/amc/register" element={<AMCRegister />} />
      <Route path="/amc/login" element={<AMCLogin />} />

      {/* AMC Protected Routes */}
      <Route path="/amc" element={<ProtectedRoute amcOnly><AMCLayout /></ProtectedRoute>}>
        <Route index element={<AMCDashboard />} />
        <Route path="fund-flows" element={<Fundflows />} />
        <Route path="nav-monitoring" element={<NavMonitoring />} />
        <Route path="compliance" element={<ComplianceReports />} />
        <Route path="reconciliation" element={<AMCReconciliation />} />
        <Route path="/amc/disclosures" element={<AMCRegulatoryDisclosure />} />
        <Route path="/amc/investors" element={<InvestorProfile />} />
        <Route path="/amc/transactions" element={<TransactionReports />} />
        <Route path="/amc/documents" element={<DocumentManagerr />} />
        <Route path="/amc/nav-upload" element={<NAVUpload userAMC="HDFC AMC" />} />
      </Route>

      {/* Distributor Routes */}
      <Route path="/distributor/register" element={<DistributorRegister />} />
      <Route path="/distributor/login" element={<DistributorLogin />} />
      <Route path="/distributor" element={<ProtectedRoute distributorOnly><DistributorLayout /></ProtectedRoute>}>
        <Route index element={<DistributorDashboard />} />
        <Route path="onboarding" element={<ClientOnboarding />} />
        <Route path="portfolio/:id" element={<ClientPortfolioView />} />
        <Route path="commissions" element={<CommissionReports />} />
        <Route path="analytics" element={<SalesAnalytics />} />
        <Route path="maintenance" element={<MaintenanceAlerts />} />
      </Route>

      {/* SEBI (Regulator) Routes */}
      <Route path="/sebi/login" element={<SEBILogin />} />
      <Route path="/sebi" element={<ProtectedRoute sebiOnly><SEBILayout /></ProtectedRoute>}>
        <Route index element={<SEBIDashboard />} />
        <Route path="compliance-monitoring" element={<ComplianceMonitoring />} />
        <Route path="regulatory-reports" element={<RegulatoryReports />} />
        <Route path="audit-trail" element={<AuditTrailAccess />} />
        <Route path="unclaimed-oversight" element={<UnclaimedOversight />} />
        <Route path="maintenance" element={<MaintenanceAlerts />} />
        <Route path="transaction-reports" element={<SEBITransactionReports />} />
        <Route path="folio-details" element={<FolioAccountDetails />} />
      </Route>

      
    </Routes>
  );
}
