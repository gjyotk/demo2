/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { RingLoader } from 'react-spinners';
import { Box } from '@mui/system';

import { useAuth } from './contexts/AuthContext';
import { isAxiosReady } from './services/axiosConfig';

import Home from './homepage/Home';
import Vocabulary from './components/Vocabulary';
import UserManagement from './components/UserManagement';
import DomainManagement from './components/DomainManagement';
import Analytics from './components/Analytics';
import AboutUs from './components/AboutUs';

import PrivateComponent from './components/PrivateComponent';
import NotFound from './components/NotFound';
import TopBar from './components/TopBar';
import BulkImport from './components/BulkImport';
import ChatBot from './components/ChatBot';

// Lazy load other components
const Add = lazy(() => import('./components/Add'));
const Vertical = lazy(() => import('./components/Vertical'));
const Alarms = lazy(() => import('./components/AlarmDetailsPage'));
const Sensortypes = lazy(() => import('./components/Sensortypes'));
const Details = lazy(() => import('./components/Details'));
const Nodedata = lazy(() => import('./components/Nodedata'));
const Addnode = lazy(() => import('./components/Addnode'));
const Addvertical = lazy(() => import('./components/Addvertical'));
const DomainCreation = lazy(() => import('./components/DomainCreation'));
const DataModel = lazy(() => import('./components/DataModel'));
const Addsensor = lazy(() => import('./components/Addsensor'));
const Login = lazy(() => import('./components/Login'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const CreateUser = lazy(() => import('./components/CreateUser'));
const AddAdvanced = lazy(() => import('./components/AddAdvanced'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));

function PrivateRoute() {
  const { isLoggedIn, isLoading } = useAuth();
  
  if (isLoading) {
    return <CenteredLoading />;
  }
  
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
}

function PublicRoute() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Navigate to="/" /> : <Outlet />;
}

function RestrictedRoute({ allowedTypes }) {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" />;
  console.log('RestrictedRoute user type:', user?.user_type);

  if (user && !allowedTypes.includes(user.user_type)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}

function CenteredLoading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <RingLoader color="#123462" loading />
    </Box>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAxiosReady = async () => {
      isAxiosReady.then(() => {
        setIsLoading(false);
      });
    };

    checkAxiosReady();
  }, [isAxiosReady]);

  if (isLoading) {
    return <CenteredLoading />;
  }

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Suspense fallback={<CenteredLoading />}>
        <TopBar>
          <Routes>
            {/* Open Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/vocabulary" element={<Vocabulary />} />
            <Route path="/aboutus" element={<AboutUs />} />
            <Route path="/create-user" element={<CreateUser />} />
            
            {/* Public Only Routes */}
            <Route path="login" element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>
            <Route path="resetpassword" element={<PublicRoute />}>
              <Route path="/resetpassword" element={<ResetPassword />} />
            </Route>

            {/* Private Only Routes */}
            <Route path="private" element={<PrivateRoute />}>
              <Route path="/private" element={<PrivateComponent />} />
            </Route>
            <Route path="domaincreation" element={<PrivateRoute />}>
              <Route path="/domaincreation" element={<DomainCreation />} />
            </Route>
            <Route path="analytics" element={<PrivateRoute />}>
              <Route path="/analytics" element={<Analytics />} />
            </Route>
            <Route path="profile" element={<PrivateRoute />}>
              <Route path="/profile" element={<UserProfile />} />
            </Route>
            <Route path="usermanagement" element={<RestrictedRoute allowedTypes={[1, 2]} />}>
              <Route path="/usermanagement" element={<UserManagement />} />
            </Route>
            <Route path="domainmanagement" element={<RestrictedRoute allowedTypes={[1]} />}>
              <Route path="" element={<DomainManagement />} />
            </Route>

            <Route path="resetpassword" element={<PrivateRoute />}>
              <Route path="/resetpassword" element={<ResetPassword />} />
            </Route>
            <Route path="verticals" element={<PrivateRoute />}>
              <Route path="/verticals" element={<Vertical />} />
              <Route path="/verticals/:id" element={<Details />} />
            </Route>
            <Route path="sensortypes" element={<PrivateRoute />}>
              <Route path="/sensortypes" element={<Sensortypes />} />
              <Route path="/sensortypes/:id" element={<Details />} />
            </Route>

            <Route path="alarms" element={<PrivateRoute />}>
              <Route path="/alarms" element={<Alarms />} />
            </Route>
            
            <Route path="details" element={<PrivateRoute />}>
              <Route path="/details" element={<Details />} />
            </Route>
            <Route path="nodedata" element={<PrivateRoute />}>
              <Route path="/nodedata" element={<Nodedata />} />
              <Route path="/nodedata/:id" element={<Nodedata />} />
            </Route>
            <Route path="addnode" element={<PrivateRoute />}>
              <Route path="/addnode" element={<Addnode />} />
            </Route>
            <Route path="addvertical" element={<PrivateRoute />}>
              <Route path="/addvertical" element={<Addvertical />} />
            </Route>
            <Route path="datamodel" element={<PrivateRoute />}>
              <Route path="/datamodel" element={<DataModel />} />
            </Route>
            <Route path="addsensor" element={<PrivateRoute />}>
              <Route path="/addsensor" element={<Addsensor />} />
            </Route>
            <Route path="add" element={<PrivateRoute />}>
              <Route path="/add" element={<Add />} />
            </Route>
            <Route path="add-advanced" element={<PrivateRoute />}>
              <Route path="/add-advanced" element={<AddAdvanced />} />
            </Route>
            <Route path="bulk-import" element={<PrivateRoute />}>
              <Route path="/bulk-import" element={<BulkImport />} />
            </Route>
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TopBar>
        <ChatBot />
      </Suspense>
    </Router>
  );
}

export default App;
