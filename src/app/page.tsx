import { SiteHeader } from '@/components/layout/SiteHeader'
import { FeatureBanners } from '@/components/landing/FeatureBanners'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <SiteHeader />
      <FeatureBanners />
      <footer className="bg-white border-t border-black/10 py-8 text-center text-sm text-gray-400">
        © 2026 Cuepath. All rights reserved.
      </footer>
    </div>
  )
}
