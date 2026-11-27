
import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import ScrollToTop from "@/components/ScrollToTop.jsx"
const PageNotFound = lazy(() => import("@/lib/PageNotFound.jsx"))

// =========================
// PUBLIC PAGES
// =========================

const Landing = lazy(() => import("@/pages/Landing.jsx"))
const Categories = lazy(() => import("@/pages/Categories.jsx"))
const TalentDetail = lazy(() => import("@/pages/talent/Detail.jsx"))

// =========================
// AUTH
// =========================

const Login = lazy(() => import("@/pages/Login.jsx"))
const Register = lazy(() => import("@/pages/Register.jsx"))
const AuthCallback = lazy(() => import("@/pages/AuthCallback.jsx"))
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword.jsx"))
const ResetPassword = lazy(() => import("@/pages/ResetPassword.jsx"))

// =========================
// PUBLIC INFORMATION / LEGAL
// =========================

const Conditions = lazy(() => import("@/pages/Conditions.jsx"))
const Confidentialite = lazy(() => import("@/pages/Confidentialite.jsx"))
const Cookies = lazy(() => import("@/pages/Cookies.jsx"))
const Cgv = lazy(() => import("@/pages/Cgv.jsx"))
const MentionsLegales = lazy(() => import("@/pages/MentionsLegales.jsx"))
const FAQ = lazy(() => import("@/pages/FAQ.jsx"))
const Contact = lazy(() => import("@/pages/Contact.jsx"))
const DataRights = lazy(() => import("@/pages/DataRights.jsx"))
const SignalerProbleme = lazy(() => import("@/pages/SignalerProbleme.jsx"))
import CookieConsent from "@/components/CookieConsent.jsx"

// =========================
// APPLICATION
// =========================

const Home = lazy(() => import("@/pages/Home.jsx"))
const Messages = lazy(() => import("@/pages/Messages.jsx"))

import ProtectedRoute from "@/components/ProtectedRoute.jsx"
import RoleGuard from "@/components/RoleGuard.jsx"
import KoraLayout from "@/components/KoraLayout.jsx"
import ManagerFeatureGate from "@/components/ManagerFeatureGate.jsx"

// =========================
// CLIENT
// =========================

const ClientDashboard = lazy(() => import("@/pages/client/Dashboard.jsx"))
const ClientBrowse = lazy(() => import("@/pages/client/Browse.jsx"))
const ClientFavorites = lazy(() => import("@/pages/client/Favorites.jsx"))
const ClientRequests = lazy(() => import("@/pages/client/Requests.jsx"))
const ClientNotifications = lazy(() => import("@/pages/client/Notifications.jsx"))
const ClientSettings = lazy(() => import("@/pages/client/ClientSettings.jsx"))
const ClientProjects = lazy(() => import("@/pages/client/Projects.jsx"))
const ClientProjectForm = lazy(() => import("@/pages/client/ProjectForm.jsx"))
const ClientProjectDetail = lazy(() => import("@/pages/client/ProjectDetail.jsx"))
const ClientReviewProject = lazy(() => import("@/pages/client/ReviewProject.jsx"))

// =========================
// MANAGER
// =========================

const ManagerDashboard = lazy(() => import("@/pages/manager/Dashboard.jsx"))
const ManagerTalents = lazy(() => import("@/pages/manager/Talents.jsx"))
const ManagerRequests = lazy(() => import("@/pages/manager/Requests.jsx"))
const ManagerRequestDetail = lazy(() => import("@/pages/manager/RequestDetail.jsx"))
const ManagerSubscription = lazy(() => import("@/pages/manager/Subscription.jsx"))
const ManagerSettings = lazy(() => import("@/pages/manager/Settings.jsx"))
const ManagerNotifications = lazy(() => import("@/pages/manager/Notifications.jsx"))
const ManagerBusinessAnalytics = lazy(() => import("@/pages/manager/BusinessAnalytics.jsx"))
const ManagerTeam = lazy(() => import("@/pages/manager/Team.jsx"))
const SubscriptionExpired = lazy(() => import("@/pages/manager/SubscriptionExpired.jsx"))

// =========================
// ADMIN / SUPERADMIN
// =========================

const AdminPanel = lazy(() => import("@/pages/admin/AdminPanel.jsx"))
const SuperAdminPanel = lazy(() => import("@/pages/admin/SuperAdminPanel.jsx"))


export default function App() {
  return (
    <>
      <ScrollToTop />
      <CookieConsent />

      <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading page"><span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-r-transparent" /></div>}>
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
            path="/cgv"
            element={<Cgv />}
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

          {/* Retour sécurisé après confirmation de l'adresse email */}
          <Route
            path="/auth/callback"
            element={<AuthCallback />}
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
            path="/subscription-expired"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["manager"]}>
                  <SubscriptionExpired />
                </RoleGuard>
              </ProtectedRoute>
            }
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

            <Route
              path="/mes-donnees"
              element={
                <RoleGuard allowedRoles={["client", "manager"]}>
                  <DataRights />
                </RoleGuard>
              }
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

            <Route
              path="/client/projects"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientProjects />
                </RoleGuard>
              }
            />

            <Route
              path="/client/projects/new"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientProjectForm />
                </RoleGuard>
              }
            />

            <Route
              path="/client/projects/:id/edit"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientProjectForm />
                </RoleGuard>
              }
            />

            <Route
              path="/client/projects/:id/review"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientReviewProject />
                </RoleGuard>
              }
            />

            <Route
              path="/client/projects/:id"
              element={
                <RoleGuard allowedRoles={["client"]}>
                  <ClientProjectDetail />
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
                  <ManagerFeatureGate feature="requests">
                    <ManagerRequests />
                  </ManagerFeatureGate>
                </RoleGuard>
              }
            />

            <Route
              path="/manager/requests/:id"
              element={
                <RoleGuard allowedRoles={["manager"]}>
                  <ManagerFeatureGate feature="requests">
                    <ManagerRequestDetail />
                  </ManagerFeatureGate>
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
                  <ManagerFeatureGate feature="notifications">
                    <ManagerNotifications />
                  </ManagerFeatureGate>
                </RoleGuard>
              }
            />

            <Route
              path="/manager/analytics"
              element={
                <RoleGuard allowedRoles={["manager"]}>
                  <ManagerBusinessAnalytics />
                </RoleGuard>
              }
            />

            <Route
              path="/manager/team"
              element={
                <RoleGuard allowedRoles={["manager"]}>
                  <ManagerTeam />
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
                <RoleGuard allowedRoles={["admin", "superadmin"]}>
                  <AdminPanel />
                </RoleGuard>
              }
            />


            {/* =====================
                SUPERADMIN / CEO
            ====================== */}

            <Route
              path="/superadmin"
              element={
                <RoleGuard allowedRoles={["superadmin"]}>
                  <SuperAdminPanel />
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
      </Suspense>
    </>
  )
}