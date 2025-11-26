import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import Layout from './components/Layout/Layout';
import Landing from './components/Landing/Landing';
import Dashboard from './components/Dashboard/Dashboard';
import Planner from './components/Planner/Planner';
import Tracker from './components/Tracker/Tracker';
import History from './components/History/History';
import Profile from './components/Profile/Profile';

function AppContent() {
  const { token, login } = useStore();
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewData, setViewData] = useState(null);

  if (!token) {
    return <Landing onLogin={login} />;
  }

  const handleViewChange = (view, data = null) => {
    setCurrentView(view);
    setViewData(data);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={handleViewChange} />;
      case 'planner':
        return <Planner />;
      case 'workout':
        return <Tracker initialWorkoutId={viewData?.initialWorkoutId} />;
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
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
