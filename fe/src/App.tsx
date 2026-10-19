import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoadingPage from './pages/LoadingPage'
import NotFoundPage from './pages/NotFoundPage'
import ResultPage from './pages/ResultPage'
import ReviewPage from './pages/ReviewPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/result/:scanId" element={<ResultPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
