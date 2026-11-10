import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import EnquiryModal from './components/EnquiryModal';
import AssistantPopup from './components/AssistantPopup';
import Home from './pages/Home';
import ServicesIndex from './pages/ServicesIndex';
import ServiceDetail from './pages/ServiceDetail';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import PortalLayout from './portal/PortalLayout';
import PortalDashboard from './portal/pages/PortalDashboard';
import TaxOrganizer from './portal/pages/TaxOrganizer';
import Documents from './portal/pages/Documents';
import Invoice from './portal/pages/Invoice';
import ReferEarn from './portal/pages/ReferEarn';
import MyReferrals from './portal/pages/MyReferrals';
import Profile from './portal/pages/Profile';
import AdminLayout from './admin/AdminLayout';
import AdminFilings from './admin/pages/AdminFilings';
import AdminFilingDetail from './admin/pages/AdminFilingDetail';
import AdminEnquiries from './admin/pages/AdminEnquiries';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** Public website chrome: header, footer and the assistant pop-up. */
function SiteLayout() {
  return (
    <>
      <Header />
      <main id="main"><Outlet /></main>
      <Footer />
      <AssistantPopup />
    </>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<ServicesIndex />} />
          <Route path="/services/:country" element={<ServicesIndex />} />
          <Route path="/services/:country/:slug" element={<ServiceDetail />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Navigate to="/portal" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Client portal (signed-in users) */}
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalDashboard />} />
          <Route path="tax-organizer" element={<TaxOrganizer />} />
          <Route path="documents" element={<Documents />} />
          <Route path="invoice" element={<Invoice />} />
          <Route path="refer" element={<ReferEarn />} />
          <Route path="referrals" element={<MyReferrals />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Route>

        {/* Staff area (role Admin) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminFilings />} />
          <Route path="filings/:id" element={<AdminFilingDetail />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
      <EnquiryModal />
    </>
  );
}
