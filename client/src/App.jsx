import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { RequireAuth } from './routes/RequireAuth.jsx';
import { RequireAdmin } from './routes/RequireAdmin.jsx';
import { SiteLayout } from './layouts/SiteLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';

import Home from './pages/site/Home.jsx';
import Shop from './pages/site/Shop.jsx';
import ProductDetail from './pages/site/ProductDetail.jsx';
import Cart from './pages/site/Cart.jsx';
import Checkout from './pages/site/Checkout.jsx';
import Login from './pages/site/Login.jsx';
import Register from './pages/site/Register.jsx';
import TrackOrder from './pages/site/TrackOrder.jsx';
import Wholesale from './pages/site/Wholesale.jsx';
import FarmVisit from './pages/site/FarmVisit.jsx';
import MyFarmVisits from './pages/site/MyFarmVisits.jsx';
import Education from './pages/site/Education.jsx';
import EducationPost from './pages/site/EducationPost.jsx';
import Loyalty from './pages/site/Loyalty.jsx';
import Account from './pages/site/Account.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminProducts from './pages/admin/Products.jsx';
import AdminInventory from './pages/admin/Inventory.jsx';
import AdminOrders from './pages/admin/Orders.jsx';
import AdminDeliveryBooking from './pages/admin/DeliveryBooking.jsx';
import AdminPayments from './pages/admin/Payments.jsx';
import AdminCustomers from './pages/admin/Customers.jsx';
import AdminEducation from './pages/admin/Education.jsx';
import AdminFarmVisits from './pages/admin/FarmVisits.jsx';
import AdminWholesaleInquiries from './pages/admin/WholesaleInquiries.jsx';
import AdminReports from './pages/admin/Reports.jsx';
import AdminSettings from './pages/admin/Settings.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="wholesale" element={<Wholesale />} />
              <Route path="farm-visit" element={<FarmVisit />} />
              <Route path="education" element={<Education />} />
              <Route path="education/:id" element={<EducationPost />} />

              <Route element={<RequireAuth />}>
                <Route path="checkout" element={<Checkout />} />
                <Route path="track-order" element={<TrackOrder />} />
                <Route path="my-farm-visits" element={<MyFarmVisits />} />
                <Route path="loyalty" element={<Loyalty />} />
                <Route path="account" element={<Account />} />
              </Route>
            </Route>

            <Route path="/admin" element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="delivery-booking" element={<AdminDeliveryBooking />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="education-posts" element={<AdminEducation />} />
                <Route path="farm-visits" element={<AdminFarmVisits />} />
                <Route path="wholesale-inquiries" element={<AdminWholesaleInquiries />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
