import { useState } from 'react'
import { User, Key, Shield, Bell, Copy, Check, Plus, Trash2 } from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'api' | 'profile' | 'team' | 'notifications'>('api')

  const teamMembers = [
    { name: 'Jane Doe', email: 'jane@acmecorp.com', role: 'Admin', status: 'Active' },
    { name: 'John Smith', email: 'john@acmecorp.com', role: 'Reviewer', status: 'Active' },
    { name: 'Alice Johnson', email: 'alice@acmecorp.com', role: 'Developer', status: 'Pending' },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account and integration preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab('api')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'api' ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Key className={`h-4 w-4 ${activeTab === 'api' ? 'text-emerald-400' : ''}`} />
            API & Webhooks
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <User className={`h-4 w-4 ${activeTab === 'profile' ? 'text-emerald-400' : ''}`} />
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'team' ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Shield className={`h-4 w-4 ${activeTab === 'team' ? 'text-emerald-400' : ''}`} />
            Team & Security
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'notifications' ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Bell className={`h-4 w-4 ${activeTab === 'notifications' ? 'text-emerald-400' : ''}`} />
            Notifications
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          
          {/* API & Webhooks Tab */}
          {activeTab === 'api' && (
            <>
              <div className="glass-panel rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-b border-white/10 pb-6 mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">API Keys</h2>
                  <p className="text-sm text-gray-400">Use these keys to authenticate API requests and integrate VeriSphere with your backend systems.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Secret Key</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <input 
                          type="password" 
                          value="sk_test_8f92j3n4v8d..." 
                          readOnly
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono focus:outline-none"
                        />
                      </div>
                      <button className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-colors flex justify-center items-center gap-2 text-sm font-bold w-full sm:w-auto">
                        <Copy className="h-4 w-4" /> Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Only reveal this key to secure backend servers. Never expose it in client-side code.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Public Key</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          value="pk_test_1m2n3b4v5c..." 
                          readOnly
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono focus:outline-none"
                        />
                      </div>
                      <button className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-colors flex justify-center items-center gap-2 text-sm font-bold w-full sm:w-auto">
                        <Copy className="h-4 w-4" /> Copy
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold transition-colors">
                      Generate New Keys
                    </button>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="border-b border-white/10 pb-6 mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">Webhook Configuration</h2>
                  <p className="text-sm text-gray-400">Configure where VeriSphere should send real-time updates about vendor verification status.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Endpoint URL</label>
                    <input 
                      type="url" 
                      placeholder="https://api.yourdomain.com/webhooks/verisphere"
                      defaultValue="https://api.acmecorp.com/webhooks/verisphere"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Webhook Secret</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <input 
                          type="password" 
                          value="whsec_83n2b1v0c9x..." 
                          readOnly
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono focus:outline-none"
                        />
                      </div>
                      <button className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-colors flex justify-center items-center gap-2 text-sm font-bold w-full sm:w-auto">
                        <Copy className="h-4 w-4" /> Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Use this secret to verify that webhook payloads actually came from VeriSphere.</p>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <button className="px-5 py-2.5 bg-emerald-500 text-gray-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5">
                      Save Changes
                    </button>
                    <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-bold transition-colors">
                      Send Test Event
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="glass-panel rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-2">My Profile</h2>
                <p className="text-sm text-gray-400">Update your personal details and how you appear in the system.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 border-4 border-gray-900 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center text-3xl font-black text-gray-950">
                    JD
                  </div>
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors">
                    Change Avatar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">First Name</label>
                    <input type="text" defaultValue="Jane" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
                    <input type="text" defaultValue="Doe" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" defaultValue="jane@acmecorp.com" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Timezone</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none">
                    <option value="WAT">West Africa Time (WAT)</option>
                    <option value="GMT">Greenwich Mean Time (GMT)</option>
                    <option value="EST">Eastern Standard Time (EST)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button className="px-6 py-3 bg-emerald-500 text-gray-950 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all hover:-translate-y-0.5">
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Team & Security Tab */}
          {activeTab === 'team' && (
            <div className="glass-panel rounded-3xl p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="border-b border-white/10 pb-6 mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Team Members</h2>
                  <p className="text-sm text-gray-400">Manage who has access to this workspace and their roles.</p>
                </div>
                <button className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" /> Invite Member
                </button>
              </div>

              <div className="space-y-4 mb-10">
                {teamMembers.map((member, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5 gap-4 sm:gap-0">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-white shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{member.name} {member.status === 'Pending' && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">Pending</span>}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                      <span className="text-xs font-semibold text-gray-300 bg-white/10 px-3 py-1 rounded-lg">{member.role}</span>
                      <button className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-8">
                <h2 className="text-xl font-bold text-white mb-2">Workspace Security</h2>
                <p className="text-sm text-gray-400 mb-6">Configure security requirements for all team members.</p>
                
                <div className="flex items-center justify-between p-5 bg-black/30 rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">Require Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-gray-400 mt-1">Force all members to enable 2FA before accessing the console.</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-500 transition-colors">
                    <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="glass-panel rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Notification Preferences</h2>
                <p className="text-sm text-gray-400">Choose what events you want to be notified about via email.</p>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'High-Risk Vendor Applications', desc: 'Get an email immediately when a vendor is flagged as high-risk.', active: true },
                  { title: 'Squad Payment Failures', desc: 'Receive alerts when verification fees fail to process.', active: true },
                  { title: 'Webhook Delivery Errors', desc: 'Get notified if we cannot reach your configured webhook endpoint.', active: true },
                  { title: 'Weekly Summary Report', desc: 'A digest of vendor screenings and trust scores every Monday.', active: false },
                  { title: 'New Device Sign-ins', desc: 'Alerts for unrecognized devices accessing your console account.', active: true },
                ].map((notif, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors">
                    <button className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${notif.active ? 'bg-emerald-500 border-emerald-500 text-gray-950' : 'border-gray-600 bg-black/40'}`}>
                      {notif.active && <Check className="h-3 w-3" />}
                    </button>
                    <div>
                      <p className="text-sm font-bold text-white">{notif.title}</p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.desc}</p>
                    </div>
                  </div>
                ))}

                <div className="pt-6 border-t border-white/10 flex justify-end">
                  <button className="px-6 py-3 bg-emerald-500 text-gray-950 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all hover:-translate-y-0.5">
                    Update Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
