import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { GroupsProvider } from "./context/GroupsContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { ToastProvider } from "./components/Toast";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AppLayout } from "./layouts/AppLayout";
import { WhatsAppFloat } from "./components/WhatsAppFloat";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { TermsPage } from "./pages/TermsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MyGroupsPage } from "./pages/MyGroupsPage";
import { CreateGroupPage } from "./pages/groups/CreateGroupPage";
import { PlansPage } from "./pages/PlansPage";
import { PaymentStatusPage } from "./pages/PaymentStatusPage";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import { PaymentFailurePage } from "./pages/PaymentFailurePage";
import { PaymentPendingPage } from "./pages/PaymentPendingPage";
import { AdminPage } from "./pages/AdminPage";
import { OnlineUsersPage } from "./pages/admin/OnlineUsersPage";
import "./App.css";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <GroupsProvider>
                <Routes>
                  <Route path="auth/callback" element={<AuthCallbackPage />} />
                  <Route path="termos" element={<TermsPage />} />
                  <Route element={<AppLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route
                      path="perfil"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="meus-grupos"
                      element={
                        <ProtectedRoute>
                          <MyGroupsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="groups/create"
                      element={
                        <ProtectedRoute>
                          <CreateGroupPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="planos" element={<PlansPage />} />
                    <Route path="payment-status" element={<PaymentStatusPage />} />
                    <Route path="success" element={<PaymentSuccessPage />} />
                    <Route path="failure" element={<PaymentFailurePage />} />
                    <Route path="pending" element={<PaymentPendingPage />} />
                    <Route path="admin" element={<AdminRoute />}>
                      <Route index element={<AdminPage />} />
                      <Route path="online-users" element={<OnlineUsersPage />} />
                    </Route>
                  </Route>
                </Routes>
              </GroupsProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ToastProvider>
        <WhatsAppFloat />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
