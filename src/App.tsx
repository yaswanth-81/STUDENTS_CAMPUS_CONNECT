import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Browse from "./pages/Browse";
import ServiceDetails from "./pages/ServiceDetails";
import Dashboard from "./pages/Dashboard";
import FindWork from "./pages/FindWork";
import PostWork from "./pages/PostWork";
import ApplyWork from "./pages/ApplyWork";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import MyServices from "./pages/MyServices";
import ServiceManage from "./pages/ServiceManage";
import CreateService from "./pages/CreateService";
import JobApplicants from "./pages/JobApplicants";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";
import { DashboardLayout } from "./layouts/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/service/:id" element={<ServiceDetails />} />

            {/* User Dashboard */}
            <Route path="/dashboard" element={<DashboardLayout variant="user" />}>
              <Route index element={<Dashboard />} />
              <Route path="find-work" element={<FindWork />} />
              <Route path="work/:workId/apply" element={<ApplyWork />} />
              <Route path="post-work" element={<PostWork />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderId" element={<OrderDetails />} />
              <Route path="my-services" element={<MyServices />} />
              <Route path="my-services/:serviceId" element={<ServiceManage />} />
              <Route path="my-services/:workId/applicants" element={<JobApplicants />} />
              <Route path="create-service" element={<CreateService />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Admin Dashboard */}
            <Route path="/admin" element={<DashboardLayout variant="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminDashboard />} />
              <Route path="services" element={<AdminDashboard />} />
              <Route path="jobs" element={<AdminDashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="reports" element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminDashboard />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
