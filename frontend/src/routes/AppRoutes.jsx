import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';

// Authentication Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// App Core Pages
import Dashboard from '../pages/dashboard/Dashboard';

// Income Management Pages
import IncomeList from '../pages/income/IncomeList';
import AddIncome from '../pages/income/AddIncome';
import EditIncome from '../pages/income/EditIncome';

// Expense Management Pages
import ExpenseList from '../pages/expense/ExpenseList';
import AddExpense from '../pages/expense/AddExpense';
import EditExpense from '../pages/expense/EditExpense';

// Budgets Pages
import BudgetList from '../pages/budgets/BudgetList';
import AddBudget from '../pages/budgets/AddBudget';
import EditBudget from '../pages/budgets/EditBudget';
import BudgetDetails from '../pages/budgets/BudgetDetails';

// Savings Goals Pages
import GoalManagement from '../pages/savings/GoalManagement';
import AddGoal from '../pages/savings/AddGoal';
import EditGoal from '../pages/savings/EditGoal';
import GoalProgress from '../pages/savings/GoalProgress';

// Reminders Pages
import ReminderList from '../pages/reminders/ReminderList';
import AddReminder from '../pages/reminders/AddReminder';
import EditReminder from '../pages/reminders/EditReminder';

// Notifications Page
import NotificationList from '../pages/notifications/NotificationList';

// OCR Scanner Pages
import ReceiptUpload from '../pages/ocr/ReceiptUpload';
import ReceiptHistory from '../pages/ocr/ReceiptHistory';

// Voice Processing Page
import VoiceExpense from '../pages/voice/VoiceExpense';

// Global Search Page
import GlobalSearch from '../pages/search/GlobalSearch';

// Data Export Page
import ExportPanel from '../pages/exports/ExportPanel';

// File Management Page
import FileManagement from '../pages/files/FileManagement';

// Phase 4 Analytics Pages
import FinancialHealth from '../pages/analytics/FinancialHealth';
import ExpenseTrends from '../pages/analytics/ExpenseTrends';
import SpendingPatterns from '../pages/analytics/SpendingPatterns';

// Phase 4 AI Pages
import Recommendations from '../pages/ai/Recommendations';
import Predictions from '../pages/ai/Predictions';
import Anomalies from '../pages/ai/Anomalies';

// Phase 4 Report Pages
import ReportsCenter from '../pages/reports/ReportsCenter';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected Pages */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Income Routes */}
          <Route path="/income" element={<IncomeList />} />
          <Route path="/income/add" element={<AddIncome />} />
          <Route path="/income/edit/:id" element={<EditIncome />} />
          
          {/* Expense Routes */}
          <Route path="/expense" element={<ExpenseList />} />
          <Route path="/expense/add" element={<AddExpense />} />
          <Route path="/expense/edit/:id" element={<EditExpense />} />

          {/* Budgets Routes */}
          <Route path="/budgets" element={<BudgetList />} />
          <Route path="/budgets/add" element={<AddBudget />} />
          <Route path="/budgets/edit/:id" element={<EditBudget />} />
          <Route path="/budgets/:id" element={<BudgetDetails />} />

          {/* Savings Goals Routes */}
          <Route path="/goals" element={<GoalManagement />} />
          <Route path="/goals/add" element={<AddGoal />} />
          <Route path="/goals/edit/:id" element={<EditGoal />} />
          <Route path="/goals/progress/:id" element={<GoalProgress />} />

          {/* Reminder Routes */}
          <Route path="/reminders" element={<ReminderList />} />
          <Route path="/reminders/add" element={<AddReminder />} />
          <Route path="/reminders/edit/:id" element={<EditReminder />} />

          {/* Notifications Routes */}
          <Route path="/notifications" element={<NotificationList />} />

          {/* OCR Scans Routes */}
          <Route path="/ocr" element={<ReceiptHistory />} />
          <Route path="/ocr/upload" element={<ReceiptUpload />} />
          <Route path="/ocr/history" element={<ReceiptHistory />} />

          {/* Voice Command Routes */}
          <Route path="/voice/expense" element={<VoiceExpense />} />

          {/* Search Routes */}
          <Route path="/search" element={<GlobalSearch />} />

          {/* Export Routes */}
          <Route path="/exports" element={<ExportPanel />} />

          {/* File management Routes */}
          <Route path="/files/management" element={<FileManagement />} />

          {/* Phase 4 Analytics Routes */}
          <Route path="/analytics/health" element={<FinancialHealth />} />
          <Route path="/analytics/trends" element={<ExpenseTrends />} />
          <Route path="/analytics/patterns" element={<SpendingPatterns />} />

          {/* Phase 4 AI Routes */}
          <Route path="/ai/recommendations" element={<Recommendations />} />
          <Route path="/ai/predictions" element={<Predictions />} />
          <Route path="/ai/anomalies" element={<Anomalies />} />

          {/* Phase 4 Reports Routes */}
          <Route path="/reports" element={<ReportsCenter />} />
        </Route>
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
