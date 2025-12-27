import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import VehiclesPage from "./pages/VehiclesPage";
import VehicleFormPage from "./pages/VehicleFormPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import OwnersPage from "./pages/OwnersPage";
import OwnerFormPage from "./pages/OwnerFormPage";
import UsersPage from "./pages/UsersPage";
import TrashPage from "./pages/TrashPage";
import InspectorApp from "./pages/InspectorApp";

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
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VehiclesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/new"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VehicleFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VehicleDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VehicleFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/owners"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OwnersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/owners/new"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OwnerFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/owners/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OwnerFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/trash"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <TrashPage />
          </ProtectedRoute>
        }
      />

      {/* Inspector Routes */}
      <Route
        path="/inspector"
        element={
          <ProtectedRoute allowedRoles={['admin', 'inspector']}>
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
