import { useParams } from 'react-router-dom'

export default function ResultPage() {
  const { scanId } = useParams<{ scanId: string }>()
  return <main>결과: {scanId}</main>
}
