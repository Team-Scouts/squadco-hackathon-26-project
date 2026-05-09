import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-[100svh] bg-gray-950 text-gray-200 font-sans selection:bg-emerald-500/30 p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[150px] animate-float-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[180px] animate-float-slower"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto pt-10 pb-20">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-emerald-400 transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Registration
        </Link>
        
        <div className="glass-panel rounded-3xl p-8 md:p-12 shadow-2xl border border-white/10 backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-t-3xl"></div>
          
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
