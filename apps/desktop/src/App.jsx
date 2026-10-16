import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import LockScreen from './components/auth/LockScreen'
import FallbackLoader from './components/FallbackLoader'
import AutoBackupProvider from './components/providers/AutoBackupProvider'
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary'

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Insights = lazy(() => import('./pages/Insights'))
const ScenesPage = lazy(() => import('./pages/ScenesPage'))
const SceneEditor = lazy(() => import('./pages/SceneEditor'))
const CharactersPage = lazy(() => import('./pages/CharactersPage'))
const CharacterProfilePage = lazy(() => import('./pages/CharacterProfilePage'))
const RelationshipsPage = lazy(() => import('./pages/RelationshipsPage'))
const LocationsPage = lazy(() => import('./pages/LocationsPage'))
const CrewPage = lazy(() => import('./pages/CrewPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const EpisodesPage = lazy(() => import('./pages/EpisodesPage'))
const ProductionReports = lazy(() => import('./pages/ProductionReports'))
const TimelinePage = lazy(() => import('./pages/TimelinePage'))
const TrashPage = lazy(() => import('./pages/TrashPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AutoBackupProvider intervalMinutes={30}>
        <LockScreen>
          <AppLayout>
        <Suspense fallback={<FallbackLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/scenarios" element={<ScenesPage />} />
            <Route path="/episodes" element={<EpisodesPage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/characters/:id" element={<CharacterProfilePage />} />
            <Route path="/relationships" element={<RelationshipsPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/crew" element={<CrewPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/reports" element={<ProductionReports />} />
            <Route path="/scene/new" element={<SceneEditor />} />
            <Route path="/scene/:id" element={<SceneEditor />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </LockScreen>
    </AutoBackupProvider>
    </GlobalErrorBoundary>
  )
}

