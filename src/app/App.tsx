import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { PrototypingAuthProvider } from '../context/PrototypingAuthContext';

import { RegisterPage } from '../pages/RegisterPage';
import { PlansPage } from '../pages/PlansPage';
import PaymentSuccessPage from '../pages/PaymentSuccessPage';

// Prototyping Design Pages
import PrototypingHome from './components/prototyping/PrototypingHome';
import ThreeDPrinting from './components/prototyping/ThreeDPrinting';
import PCBPrinting from './components/prototyping/PCBPrinting';
import PCBDesign from './components/prototyping/PCBDesign';
import LaserCutting from './components/prototyping/LaserCutting';
import SEMTEM from './components/prototyping/SEMTEM';
import ProjectDevelopment from './components/prototyping/ProjectDevelopment';
import ProductTesting from './components/prototyping/ProductTesting';
import PrototypingCart from './components/prototyping/PrototypingCart';
import PrototypingAuth from './components/prototyping/PrototypingAuth';
import PrototypingOrders from './components/prototyping/PrototypingOrders';
import PrototypingTrack from './components/prototyping/PrototypingTrack';
import PrototypingAccount from './components/prototyping/PrototypingAccount';
import ContactSupport from './components/prototyping/ContactSupport';

// CMS Admin Pages
import CMSLayout from './components/cms/CMSLayout';
import CMSDashboard from './components/cms/CMSDashboard';
import ServiceOrdersPage from './components/cms/ServiceOrdersPage';
import InquiriesPage from './components/cms/InquiriesPage';
import UsersPage from './components/cms/UsersPage';
import PricingPage from './components/cms/PricingPage';
import CMSPayments from './components/cms/CMSPayments';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Navigate to="/prototyping/auth" replace />} />

          <Route path="/" element={<Navigate to="/prototyping" replace />} />

          <Route path="/register" element={<RegisterPage />} />
          <Route path="/plans" element={<PlansPage />} />

          {/* Prototyping Design Pages — wrapped in PrototypingAuthProvider for in-memory session */}
          <Route path="/prototyping/*" element={
            <PrototypingAuthProvider>
              <Routes>
                <Route index element={<PrototypingHome />} />
                <Route path="3d-printing" element={<ThreeDPrinting />} />
                <Route path="pcb-printing" element={<PCBPrinting />} />
                <Route path="pcb-design" element={<PCBDesign />} />
                <Route path="laser-cutting" element={<LaserCutting />} />
                <Route path="sem-tem" element={<SEMTEM />} />
                <Route path="project-dev" element={<ProjectDevelopment />} />
                <Route path="product-testing" element={<ProductTesting />} />
                <Route path="cart" element={<PrototypingCart />} />
                <Route path="auth" element={<PrototypingAuth />} />
                <Route path="orders" element={<PrototypingOrders />} />
                <Route path="track" element={<PrototypingTrack />} />
                <Route path="account" element={<PrototypingAccount />} />
                <Route path="support" element={<ContactSupport />} />
              </Routes>
            </PrototypingAuthProvider>
          } />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />

          {/* CMS Admin */}
          <Route path="/cms" element={<CMSLayout />}>
            <Route index element={<Navigate to="/cms/dashboard" replace />} />
            <Route path="dashboard" element={<CMSDashboard />} />
            <Route path="pcb-printing" element={<ServiceOrdersPage serviceFilter="PCB Printing" title="PCB Printing Orders" />} />
            <Route path="pcb-design" element={<ServiceOrdersPage serviceFilter="PCB Design" title="PCB Design Orders" />} />
            <Route path="3d-printing" element={<ServiceOrdersPage serviceFilter="3D Printing" title="3D Printing Orders" />} />
            <Route path="laser-cutting" element={<ServiceOrdersPage serviceFilter="Laser Cutting" title="Laser Cutting Orders" />} />
            <Route path="pcb-design-inquiries" element={<InquiriesPage serviceFilter="PCB_DESIGN" title="PCB Design Inquiries" />} />
            <Route path="sem-tem" element={<InquiriesPage serviceFilter="SEM_TEM" title="SEM/TEM Analysis Inquiries" />} />
            <Route path="project-dev" element={<InquiriesPage serviceFilter="PROJECT_DEV" title="Project Development Inquiries" />} />
            <Route path="support-inbox" element={<InquiriesPage serviceFilter="SUPPORT" title="Support Inbox" />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="payments" element={<CMSPayments />} />
            <Route path="pricing" element={<PricingPage />} />
          </Route>

          {/* Legacy/Other Routes */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}