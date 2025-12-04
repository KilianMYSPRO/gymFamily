import React, { useState, Suspense, lazy } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import Layout from './components/Layout/Layout';
import Landing from './components/Landing/Landing';
import Loading from './components/common/Loading';

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const Planner = lazy(() => import('./components/Planner/Planner'));
const Tracker = lazy(() => import('./components/Tracker/Tracker'));
const History = lazy(() => import('./components/History/History'));
const Profile = lazy(() => import('./components/Profile/Profile'));

import ErrorBoundary from './components/common/ErrorBoundary';

function AppContent() {
  const { token, login } = useStore();
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('duogym-current-view') || 'dashboard';
  });
  const [viewData, setViewData] = useState(() => {
    try {
      const saved = localStorage.getItem('duogym-view-data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  if (!token) {
    return <Landing onLogin={login} />;
  }

  const handleViewChange = (view, data = null) => {
    setCurrentView(view);
    localStorage.setItem('duogym-current-view', view);
    setViewData(data);
    if (data) {
      localStorage.setItem('duogym-view-data', JSON.stringify(data));
    } else {
      localStorage.removeItem('duogym-view-data');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={handleViewChange} />;
      case 'planner':
        return <Planner />;
      case 'workout':
        return <Tracker initialWorkoutId={viewData?.initialWorkoutId} onViewChange={handleViewChange} />;
      case 'history':
        return <History />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onViewChange={handleViewChange} />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={handleViewChange}>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          {renderView()}
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

import { LanguageProvider } from './context/LanguageContext';

import { DuoProvider } from './context/DuoContext';

function App() {
  return (
    <StoreProvider>
      <LanguageProvider>
        <DuoProvider>
          <AppContent />
        </DuoProvider>
      </LanguageProvider>
    </StoreProvider>
  );
}

export default App;
