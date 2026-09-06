import { Navbar } from "@/components/sections/navbar"
import { VideoHero } from "@/components/sections/video-hero"
import { Integrations } from "@/components/sections/integrations"
import { Problems } from "@/components/sections/problems"
import { Solutions } from "@/components/sections/solutions"
import { Numbers } from "@/components/sections/numbers"
import { Compare } from "@/components/sections/compare"
import { Cta } from "@/components/sections/cta"
import { Faq } from "@/components/sections/faq"
import { Footer } from "@/components/sections/footer"
import { social } from "@/lib/social"

// Shared vertical rhythm so stacked sections flow cohesively instead of
// each carrying its original standalone (py-32) spacing.
const SECTION_SPACING = "py-16 md:py-24"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex flex-col">
        <VideoHero
          previewVideo={{ src: "/images/brain_neurons.mp4" }}
          previewImage={{
            src: "/images/brain_neurons_placeholder.png",
            alt: "Neural network visualization",
          }}
          badge={{ text: "Self-hosted · gRPC · Pre-release" }}
          heading="Your prompts are your product. Stop renting them."
          description="A self-hosted prompt registry with a diff that tells a typo from a policy flip, then pushes that verdict to every agent running it."
          promoLine="Priompt: Git, but for your AI prompts."
          speaker={undefined}
          buttons={{
            primary: { text: "Get started", url: social.github },
            secondary: { text: "Read the docs", url: social.github },
          }}
        />
        <Problems className={SECTION_SPACING} />
        <div id="features" className="scroll-mt-24">
          <Solutions className={`overflow-hidden ${SECTION_SPACING}`} />
        </div>
        <Numbers className={SECTION_SPACING} />
        <div id="compare" className="scroll-mt-24">
          <Compare className={SECTION_SPACING} />
        </div>
        <Cta className={SECTION_SPACING} />
        <div id="faq" className="scroll-mt-24">
          <Faq className={SECTION_SPACING} />
        </div>
      </main>
      <Footer className="border-t border-border py-10 md:py-12" />
    </div>
  )
}
