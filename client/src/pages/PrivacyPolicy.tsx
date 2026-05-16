import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-vs-background p-6 font-sans text-zinc-200 selection:bg-white/20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/[0.035] blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-white/[0.025] blur-[180px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto pt-10 pb-20">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Registration
        </Link>
        
        <div className="panel-card relative p-8 md:p-12">
          <div className="absolute top-0 left-0 h-px w-full bg-white/20"></div>
          
          <h1 className="text-4xl font-black text-white tracking-tight mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-400 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create or modify your account, request support, or otherwise communicate with us. This includes identity data, company information, and device telemetry.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. How We Use Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our fraud intelligence platform. Specifically, we use it to generate trust scores, identify risk clusters, and process verification transactions.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. Data Sharing</h2>
              <p>
                We do not sell your personal information. We may share information with integrated payment providers (e.g., Squad) solely for the purpose of executing requested verifications.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Security</h2>
              <p>
                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. Data is encrypted in transit and at rest.
              </p>
            </section>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  )
}
