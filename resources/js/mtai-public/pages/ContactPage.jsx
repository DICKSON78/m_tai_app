import { useState } from 'react'

const contactInfo = [
  { label: 'Email', value: 'hello@m-tai.com', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { label: 'Phone', value: '+255 700 000 000', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
  { label: 'Location', value: 'Nairobi, Kenya', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
]

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A140C] py-32 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D4AA]/10 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <span className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 text-[#00D4AA] text-xs font-bold uppercase tracking-widest rounded-full mb-6">
            Contact Us
          </span>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-[1.05] mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
            Have a question or want to learn more? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-16">
            {/* Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-[#00D4AA]/5 border border-[#00D4AA]/20 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-[#00D4AA]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-[#0A140C] mb-2">Message Sent!</h3>
                  <p className="text-gray-500">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#0A140C] mb-2">First Name</label>
                      <input type="text" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA] transition-all" placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0A140C] mb-2">Last Name</label>
                      <input type="text" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA] transition-all" placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0A140C] mb-2">Email</label>
                    <input type="email" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA] transition-all" placeholder="john@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0A140C] mb-2">Subject</label>
                    <input type="text" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA] transition-all" placeholder="How can we help?" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0A140C] mb-2">Message</label>
                    <textarea required rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA] transition-all resize-none" placeholder="Tell us more..." />
                  </div>
                  <button type="submit" className="px-8 py-3.5 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-[#00D4AA]/25 transition-all duration-300">
                    Send Message
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-8">
              {contactInfo.map((info, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-[#00D4AA]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={info.icon}/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0A140C] mb-0.5">{info.label}</p>
                    <p className="text-gray-500 text-sm">{info.value}</p>
                  </div>
                </div>
              ))}

              <div className="bg-gray-50 p-6 rounded-2xl mt-8">
                <h4 className="text-[#0A140C] font-bold text-sm mb-2">Office Hours</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Monday - Friday: 8:00 AM - 6:00 PM<br />
                  Saturday: 9:00 AM - 1:00 PM<br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
