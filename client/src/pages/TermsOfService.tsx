import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfService() {
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
          
          <h1 className="text-4xl font-black text-white tracking-tight mb-8">Terms of Service</h1>
          
          <div className="space-y-6 text-gray-400 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the VeriSphere platform, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access the service.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
              <p>
                VeriSphere provides a fraud intelligence and identity verification platform. The services include document screening, payment telemetry analysis, and device intelligence.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. User Responsibilities</h2>
              <p>
                You are responsible for maintaining the security of your account and password. You agree to provide accurate and complete information when registering for an account.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Data Processing & Privacy</h2>
              <p>
                Your use of VeriSphere is also governed by our Privacy Policy. By using the platform, you consent to the processing of personal and business data as described therein.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Disclaimer of Warranties</h2>
              <p>
                The service is provided "as is". VeriSphere makes no warranties, expressed or implied, regarding the accuracy or reliability of the fraud intelligence scores provided.
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
