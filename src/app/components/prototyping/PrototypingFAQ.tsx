import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface PrototypingFAQProps {
  faqs: FAQItem[];
  title?: string;
  description?: string;
}

export function PrototypingFAQ({
  faqs,
  title = 'Frequently Asked Questions',
  description,
}: PrototypingFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-6 sm:px-8 bg-glass-bg">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">{title}</h2>
          {description && <p className="text-text-secondary text-lg">{description}</p>}
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-border-glass rounded-xl bg-surface-100 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-100 transition-colors"
              >
                <h3 className="text-sm font-semibold text-text-primary text-left">{faq.question}</h3>
                <ChevronDown
                  className={`w-4 h-4 text-[#00cc55] flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 py-4 bg-glass-bg border-t border-border-glass">
                  <p className="text-text-secondary text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-[#00cc55]/5 border border-[#00cc55]/20 rounded-xl text-center">
          <p className="text-text-secondary mb-4 text-sm">Didn't find what you're looking for?</p>
          <a
            href="mailto:support@pulsex.com"
            className="inline-block px-6 py-2 bg-[#00cc55] hover:bg-[#00cc55]/90 text-black font-semibold rounded-lg transition-colors text-sm"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
