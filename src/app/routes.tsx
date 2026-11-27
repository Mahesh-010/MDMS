import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  type RouteObject,
} from "react-router-dom";
import { NotFoundPage } from "../shared/components/NotFoundPage";
import { PageLoader } from "../shared/components/PageLoader";
import { ServerErrorPage } from "../shared/components/ServerErrorPage";
import { AppLayout } from "../shared/layout/AppLayout";
import { StatusPage } from "../shared/pages/StatusPage";

function lazyPlaceholder(title: string) {
  return lazy(() =>
    import("../shared/pages/PlaceholderPage").then(({ PlaceholderPage }) => ({
      default: function RoutePage() {
        return <PlaceholderPage title={title} />;
      },
    })),
  );
}

function pageElement(title: string) {
  const Page = lazyPlaceholder(title);

  return (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  );
}

const publicRoutes: RouteObject[] = [
  {
    path: "login",
    lazy: async () => {
      const { default: LoginPage } = await import("../auth/pages/LoginPage");
      return {
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      };
    },
  },
  {
    path: "forgot-password",
    lazy: async () => {
      const { default: ForgotPasswordPage } =
        await import("../auth/pages/ForgotPasswordPage");
      return {
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      };
    },
  },
  {
    path: "reset-password/:token",
    lazy: async () => {
      const { default: ResetPasswordPage } =
        await import("../auth/pages/ResetPasswordPage");
      return {
        element: (
          <Suspense fallback={<PageLoader />}>
            <ResetPasswordPage />
          </Suspense>
        ),
      };
    },
  },
  {
    path: "maintenance",
    element: (
      <StatusPage
        eyebrow="Scheduled maintenance"
        title="We’ll be back soon"
        description="MDMS is temporarily unavailable while we carry out scheduled maintenance. Please try again shortly."
        primaryAction={{ label: "Back to Login", to: "/login" }}
      />
    ),
  },
  {
    path: "access-denied",
    element: (
      <StatusPage
        eyebrow="Access control"
        code="403"
        title="Access denied"
        description="You don’t have permission to view this page. Contact your administrator if you think you should have access."
        primaryAction={{ label: "Back to Login", to: "/login" }}
        secondaryAction={{ label: "Go to dashboard", to: "/user/dashboard" }}
      />
    ),
  },
];

const appRoutes: RouteObject[] = [
  {
    path: "user",
    element: <AppLayout role="end-user" />,
    children: [
      {
        index: true,
        element: <Navigate replace to="/user/dashboard" />,
      },
      {
        path: "dashboard",
        lazy: async () => {
          const { default: DashboardPage } =
            await import("../end-user/pages/DashboardPage");
          return {
            element: (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          };
        },
      },
      {
        path: "bills",
        lazy: async () => {
          const { default: BillsPage } =
            await import("../end-user/pages/BillsPage");
          return {
            element: (
              <Suspense fallback={<PageLoader />}>
                <BillsPage />
              </Suspense>
            ),
          };
        },
      },
      {
        path: "bills/:billId",
        lazy: async () => {
          const { default: BillDetailsPage } =
            await import("../end-user/pages/BillDetailsPage");
          return {
            element: (
              <Suspense fallback={<PageLoader />}>
                <BillDetailsPage />
              </Suspense>
            ),
          };
        },
      },
      {
        path: "meter-data",
        lazy: async () => {
          const { default: MeterDataPage } =
            await import("../end-user/pages/MeterDataPage");
          return {
            element: (
              <Suspense fallback={<PageLoader />}>
                <MeterDataPage />
              </Suspense>
            ),
          };
        },
      },
      {
        path: "alerts",
        lazy: async () => {
          const { default: AlertsPage } =
            await import("../end-user/pages/AlertsPage");
          return {
            element: (
              <Suspense fallback={<PageLoader />}>
                <AlertsPage />
              </Suspense>
            ),
          };
        },
      },
      {
        path: "settings",
        lazy: async () => {
          const { default: SettingsPage } =
            await import("../end-user/pages/SettingsPage");

          return {
            element: (
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            ),
          };
        },
      },
    ],
  },
  {
    path: "zone",
    element: <AppLayout role="zone" />,
    children: [
      {
        index: true,
        element: <Navigate replace to="/zone/dashboard" />,
      },
      { path: "dashboard", element: pageElement("Zone dashboard") },
      { path: "meters", element: pageElement("Zone meters") },
      { path: "meters/:meterId", element: pageElement("Meter details") },
      { path: "users", element: pageElement("Zone users") },
      { path: "reports", element: pageElement("Zone reports") },
      { path: "alerts", element: pageElement("Zone alerts") },
      { path: "settings", element: pageElement("Zone settings") },
    ],
  },
  {
    path: "enterprise",
    element: <AppLayout role="enterprise" />,
    children: [
      {
        index: true,
        element: <Navigate replace to="/enterprise/dashboard" />,
      },
      {
        path: "dashboard",
        lazy: async () => {
          const { default: EnterpriseDashboardPage } =
            await import("../modules/enterprise-admin/pages/EnterpriseDashboardPage");

          return {
            element: (
              <Suspense fallback={<PageLoader />}>
                <EnterpriseDashboardPage />
              </Suspense>
            ),
          };
        },
      },
      { path: "zones", element: pageElement("Enterprise zones") },
      { path: "zones/:zoneId", element: pageElement("Zone details") },
      { path: "meters", element: pageElement("Enterprise meters") },
      { path: "users", element: pageElement("Enterprise users") },
      { path: "reports", element: pageElement("Enterprise reports") },
      { path: "alerts", element: pageElement("Enterprise alerts") },
      { path: "audit-logs", element: pageElement("Audit logs") },
      { path: "settings", element: pageElement("Enterprise settings") },
    ],
  },
  {
    path: "profile",
    element: <AppLayout role="end-user" />,
    children: [{ index: true, element: pageElement("Profile") }],
  },
];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    errorElement: <ServerErrorPage />,
    children: [
      ...publicRoutes,
      {
        index: true,
        element: <Navigate replace to="/user/dashboard" />,
      },
      ...appRoutes,
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
