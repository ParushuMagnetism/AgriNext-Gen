import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import FarmerDashboard from "./pages/farmer/Dashboard";
import FarmerListings from "./pages/farmer/Listings";
import FarmerOrders from "./pages/farmer/Orders";
import FarmerEarnings from "./pages/farmer/Earnings";
import FarmerCrops from "./pages/farmer/Crops";
import FarmerFarmlands from "./pages/farmer/Farmlands";
import FarmerTransport from "./pages/farmer/Transport";
import FarmerNotifications from "./pages/farmer/Notifications";
import FarmerSettings from "./pages/farmer/Settings";
import AgentDashboard from "./pages/agent/Dashboard";
import AgentTasks from "./pages/agent/Tasks";
import AgentFarmers from "./pages/agent/Farmers";
import AgentTransport from "./pages/agent/Transport";
import LogisticsDashboard from "./pages/logistics/Dashboard";
import LogisticsAvailableLoads from "./pages/logistics/AvailableLoads";
import LogisticsActiveTrips from "./pages/logistics/ActiveTrips";
import LogisticsCompletedTrips from "./pages/logistics/CompletedTrips";
import LogisticsVehicles from "./pages/logistics/Vehicles";
import LogisticsTripDetail from "./pages/logistics/TripDetail";
import LogisticsProfile from "./pages/logistics/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Farmer Routes */}
            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/crops"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <FarmerCrops />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/farmlands"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <FarmerFarmlands />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/transport"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <FarmerTransport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/listings"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <FarmerListings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/orders"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <FarmerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/earnings"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <FarmerEarnings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/notifications"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <FarmerNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/settings"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <FarmerSettings />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Agent Routes */}
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute allowedRoles={["agent"]}>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/tasks"
              element={
                <ProtectedRoute allowedRoles={["agent"]}>
                  <AgentTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/farmers"
              element={
                <ProtectedRoute allowedRoles={["agent"]}>
                  <AgentFarmers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/transport"
              element={
                <ProtectedRoute allowedRoles={["agent"]}>
                  <AgentTransport />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Logistics Routes */}
            <Route
              path="/logistics/dashboard"
              element={
                <ProtectedRoute allowedRoles={["logistics"]}>
                  <LogisticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/loads"
              element={
                <ProtectedRoute allowedRoles={["logistics"]}>
                  <LogisticsAvailableLoads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/trips"
              element={
                <ProtectedRoute allowedRoles={["logistics"]}>
                  <LogisticsActiveTrips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/completed"
              element={
                <ProtectedRoute allowedRoles={["logistics"]}>
                  <LogisticsCompletedTrips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/vehicles"
              element={
                <ProtectedRoute allowedRoles={["logistics"]}>
                  <LogisticsVehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/trip/:id"
              element={
                <ProtectedRoute allowedRoles={["logistics"]}>
                  <LogisticsTripDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/profile"
              element={
                <ProtectedRoute allowedRoles={["logistics"]}>
                  <LogisticsProfile />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
