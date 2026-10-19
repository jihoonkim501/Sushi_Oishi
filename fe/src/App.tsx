import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import ErrorPage from './pages/ErrorPage'
import HomePage from './pages/HomePage'
import LoadingPage from './pages/LoadingPage'
import NotFoundPage from './pages/NotFoundPage'
import ResultPage from './pages/ResultPage'
import ReviewPage from './pages/ReviewPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/loading" element={<LoadingPage />} />
            <Route path="/result/:scanId" element={<ResultPage />} />
            <Route path="/not-found" element={<NotFoundPage />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
