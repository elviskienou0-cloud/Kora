import { Routes, Route, Navigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"

import ScrollToTop from "@/components/ScrollToTop.jsx"
import PageNotFound from "@/lib/PageNotFound.jsx"

// =========================
// PUBLIC PAGES
// =========================

import Landing from "@/pages/Landing.jsx"
import Categories from "@/pages/Categories.jsx"
import TalentDetail from "@/pages/talent/Detail.jsx"

// =========================
// AUTH
// =========================

import Login from "@/pages/Login.jsx"
import Register from "@/pages/Register.jsx"
import ForgotPassword from "@/pages/ForgotPassword.jsx"
import ResetPassword from "@/pages/ResetPassword.jsx"
import OAuthConsent from "@/pages/OAuthConsent.jsx"

// =========================
// PUBLIC INFORMATION / LEGAL
// =========================

import Conditions from "@/pages/Conditions.jsx"
import Confidentialite from "@/pages/Confidentialite.jsx"
import Cookies from "@/pages/Cookies.jsx"
import MentionsLegales from "@/pages/MentionsLegales.jsx"
import FAQ from "@/pages/FAQ.jsx"
import Contact from "@/pages/Contact.jsx"
import SignalerProbleme from "@/pages/SignalerProbleme.jsx"

// =========================
// APPLICATION
// =========================

import Home from "@/pages/Home.jsx"
import Messages from "@/pages/Messages.jsx"

import ProtectedRoute from "@/components/ProtectedRoute.jsx"
import RoleGuard from "@/components/RoleGuard.jsx"
import KoraLayout from "@/components/KoraLayout.jsx"

// =========================
// CLIENT
// =========================

import ClientDashboard from "@/pages/client/Dashboard.jsx"
import ClientBrowse from "@/pages/client/Browse.jsx"
import ClientFavorites from "@/pages/client/Favorites.jsx"
import ClientRequests from "@/pages/client/Requests.jsx"
import ClientNotifications from "@/pages/client/Notifications.jsx"
import ClientSettings from "@/pages/client/ClientSettings.jsx"

// =========================
// MANAGER
// =========================

import ManagerDashboard from "@/pages/manager/Dashboard.jsx"
import ManagerTalents from "@/pages/manager/Talents.jsx"
import ManagerRequests from "@/pages/manager/Requests.jsx"
import ManagerRequestDetail from "@/pages/manager/RequestDetail.jsx"
import ManagerSubscription from "@/pages/manager/Subscription.jsx"
import ManagerSettings from "@/pages/manager/Settings.jsx"
import ManagerNotifications from "@/pages/manager/Notifications.jsx"

// =========================
// ADMIN
// =========================

import AdminPanel from "@/pages/admin/AdminPanel.jsx"


export default function App() {
  return (
    <>
      <ScrollToTop />

      <AnimatePresence mode="wait">
        <Routes>

          {/* =====================================================
              PUBLIC ROUTES
          ====================================================== */}

          <Route
            path="/"
            element={<Landing />}
          />

          <Route
            path="/categories"
            element={<Categories />}
          />

          <Route
            path="/talent/:id"
            element={<TalentDetail />}
          />


          {/* =====================================================
              PUBLIC INFORMATION / LEGAL
          ====================================================== */}

          <Route
            path="/conditions"
            element={<Conditions />}
          />

          <Route
            path="/confidentialite"
            element={<Confidentialite />}
          />

          <Route
            path="/cookies"
            element={<Cookies />}
          />

          <Route
            path="/mentions-legales"
            element={<MentionsLegales />}
          />

          <Route
            path="/faq"
            element={<FAQ />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />

          <Route
            path="/signaler-un-probleme"
            element={<SignalerProbleme />}
          />


          {/* =====================================================
              AUTH ROUTES
          ====================================================== */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          <Route
            path="/oauth/consent"
            element={<OAuthConsent />}
          />


          {/* =====================================================
              PROTECTED APPLICATION
          ====================================================== */}

          <Route
            element={
              <ProtectedRoute>
                <KoraLayout />
              </ProtectedRoute>
            }
          >

            {/* =====================
                HOME
            ====================== */}

            <Route
              path="/home"
              element={<Home />}
            />


            {/* =====================
                CLIENT
            ====================== */}

            <Route
              path="/client/dashboard"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientDashboard />
                </RoleGuard>
              }
            />

            <Route
              path="/client/browse"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientBrowse />
                </RoleGuard>
              }
            />

            <Route
              path="/client/favorites"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientFavorites />
                </RoleGuard>
              }
            />

            <Route
              path="/client/requests"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientRequests />
                </RoleGuard>
              }
            />

            <Route
              path="/client/notifications"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientNotifications />
                </RoleGuard>
              }
            />

            <Route
              path="/client/profile"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientSettings initialTab="profile" />
                </RoleGuard>
              }
            />

            <Route
              path="/client/settings"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientSettings initialTab="preferences" />
                </RoleGuard>
              }
            />


            {/* =====================
                MANAGER
            ====================== */}

            <Route
              path="/manager/dashboard"
              element={
                <RoleGuard allowedRoles={["manager"]}>
                  <ManagerDashboard />
                </RoleGuard>
              }
            />

            <Route
              path="/manager/talents"
              element={
                <RoleGuard allowedRoles={["manager"]}>
                  <ManagerTalents />
                </RoleGuard>
              }
            />

            <Route
              path="/manager/requests"
              element={
                <RoleGuard allowedRoles={["manager"]}>
                  <ManagerRequests />
                </RoleGuard>
              }
            />

            <Route
              path="/manager/requests/:id"
              element={
                <RoleGuard allowedRoles={["manager"]}>
                  <ManagerRequestDetail />
                </RoleGuard>
              }
            />

            <Route
              path="/manager/subscription"
              element={
                <RoleGuard allowedRoles={["manager"]}>
                  <ManagerSubscription />
                </RoleGuard>
              }
            />

            <Route
              path="/manager/settings"
              element={
                <RoleGuard allowedRoles={["manager"]}>
                  <ManagerSettings />
                </RoleGuard>
              }
            />

            <Route
              path="/manager/notifications"
              element={
                <RoleGuard allowedRoles={["manager"]}>
                  <ManagerNotifications />
                </RoleGuard>
              }
            />


            {/* =====================
                MESSAGES
            ====================== */}

            <Route
              path="/messages"
              element={
                <RoleGuard allowedRoles={["client", "manager"]}>
                  <Messages />
                </RoleGuard>
              }
            />


            {/* =====================
                ADMIN
            ====================== */}

            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <AdminPanel />
                </RoleGuard>
              }
            />

          </Route>


          {/* =====================================================
              ERROR
          ====================================================== */}

          <Route
            path="/404"
            element={<PageNotFound />}
          />

          <Route
            path="*"
            element={<Navigate to="/404" replace />}
          />

        </Routes>
      </AnimatePresence>
    </>
  )
}
