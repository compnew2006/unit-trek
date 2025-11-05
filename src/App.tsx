import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LocaleProvider } from "./context/LocaleContext";
import { WarehouseProvider } from "./context/WarehouseContext";
import { InventoryProvider } from "./context/InventoryContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";

// Lazy load pages for code splitting and better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Movement = lazy(() => import("./pages/Movement"));
const History = lazy(() => import("./pages/History"));
const Warehouses = lazy(() => import("./pages/Warehouses"));
const AllWarehouses = lazy(() => import("./pages/AllWarehouses"));
const Users = lazy(() => import("./pages/Users"));
const Permissions = lazy(() => import("./pages/Permissions"));
const ImportExport = lazy(() => import("./pages/ImportExport"));
const Reports = lazy(() => import("./pages/Reports"));
const DuplicateBarcodes = lazy(() => import("./pages/DuplicateBarcodes"));
const BarcodeTools = lazy(() => import("./pages/BarcodeTools"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Optimized React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime) - cache kept for 10 minutes
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      retry: 1, // Retry failed mutations once
    },
  },
});

const AppContent = () => {
  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        </div>
      );
    }
    
    return user ? <>{children}</> : <Navigate to="/auth" replace />;
  };

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <WarehouseProvider>
          <InventoryProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner position="top-right" />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                      <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                      <Route path="inventory" element={<ErrorBoundary><Inventory /></ErrorBoundary>} />
                      <Route path="movement" element={<ErrorBoundary><Movement /></ErrorBoundary>} />
                      <Route path="history" element={<ErrorBoundary><History /></ErrorBoundary>} />
                      <Route path="warehouses" element={<ErrorBoundary><Warehouses /></ErrorBoundary>} />
                      <Route path="all-warehouses" element={<ErrorBoundary><AllWarehouses /></ErrorBoundary>} />
                      <Route path="users" element={<ErrorBoundary><Users /></ErrorBoundary>} />
                      <Route path="permissions" element={<ErrorBoundary><Permissions /></ErrorBoundary>} />
                      <Route path="import-export" element={<ErrorBoundary><ImportExport /></ErrorBoundary>} />
                      <Route path="reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
                      <Route path="analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
                      <Route path="duplicate-barcodes" element={<ErrorBoundary><DuplicateBarcodes /></ErrorBoundary>} />
                      <Route path="barcode-tools" element={<ErrorBoundary><BarcodeTools /></ErrorBoundary>} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </InventoryProvider>
        </WarehouseProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LocaleProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
