import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import Index from "./pages/Index";
import InspectorApp from "./pages/InspectorApp";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import OwnerFormPage from "./pages/OwnerFormPage";
import OwnersPage from "./pages/OwnersPage";
import TrashPage from "./pages/TrashPage";
import UsersPage from "./pages/UsersPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import VehicleFormPage from "./pages/VehicleFormPage";
import VehiclesPage from "./pages/VehiclesPage";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={user?.role === 'inspector' ? '/inspector' : '/admin'} replace />
            : <LoginPage />
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <VehiclesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/new"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <VehicleFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <VehicleDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <VehicleFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/owners"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <OwnersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/owners/new"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <OwnerFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/owners/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <OwnerFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/trash"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <TrashPage />
          </ProtectedRoute>
        }
      />

      {/* Inspector Routes */}
      <Route
        path="/inspector"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'inspector']}>
            <InspectorApp />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
