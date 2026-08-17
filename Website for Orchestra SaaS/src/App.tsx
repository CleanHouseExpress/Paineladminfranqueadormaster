import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import TrustBar from './components/TrustBar'
import ProblemSection from './components/ProblemSection'
import PlatformModules from './components/PlatformModules'
import NetworkSection from './components/NetworkSection'
import FranqueadoraSection from './components/FranqueadoraSection'
import FranqueadoSection from './components/FranqueadoSection'
import IntegrationSection from './components/IntegrationSection'
import AISection from './components/AISection'
import AutomationSection from './components/AutomationSection'
import SecuritySection from './components/SecuritySection'
import CTASection from './components/CTASection'
import Footer from './components/Footer'
import DemoModal from './components/DemoModal'

export default function App() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header onDemo={() => setDemoOpen(true)} />

      <main>
        <Hero onDemo={() => setDemoOpen(true)} />
        <TrustBar />
        <ProblemSection />
        <PlatformModules />
        <NetworkSection />
        <FranqueadoraSection />
        <FranqueadoSection />
        <IntegrationSection />
        <AISection />
        <AutomationSection />
        <SecuritySection />
        <CTASection onDemo={() => setDemoOpen(true)} />
      </main>

      <Footer onDemo={() => setDemoOpen(true)} />

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}
