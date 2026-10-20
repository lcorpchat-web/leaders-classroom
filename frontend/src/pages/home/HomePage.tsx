import { FeaturesSection } from './sections/FeaturesSection'
import { HeroSection } from './sections/HeroSection'
import { StatsSection } from './sections/StatsSection'

/** Page d'accueil visiteur (maquette 01-page-accueil). */
export function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
    </>
  )
}
