import { useEffect, useState } from 'react'
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

const WEBSITE_TITLE = 'Orchestra | Plataforma de gestao para franquias';
const WEBSITE_DESCRIPTION = 'Centralize operacoes, implantacao, catalogo, financeiro, comunicacao, automacao e IA em uma plataforma SaaS para redes de franquias.';

export default function WebsiteHomePage() {
  const [demoOpen, setDemoOpen] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = description?.content

    document.title = WEBSITE_TITLE
    if (description) {
      description.content = WEBSITE_DESCRIPTION
    }

    return () => {
      document.title = previousTitle
      if (description && previousDescription) {
        description.content = previousDescription
      }
    }
  }, [])

  return (
    <div className="orchestra-website min-h-screen bg-zinc-50">
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
