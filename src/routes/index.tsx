import { createFileRoute } from '@tanstack/react-router'
import Simulator from '../components/Simulator'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <Simulator />
}
