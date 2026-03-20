import { motion } from 'motion/react';
import { Check, ArrowRight, Zap, Shield, Crown } from 'lucide-react';
import { XPulseLogo } from '../app/components/XPulseIcon';
import { useNavigate } from 'react-router-dom';

export function PlansPage() {
    const navigate = useNavigate();

    const plans = [
        {
            name: 'Basic Admin',
            price: '$29',
            period: '/month',
            description: 'Perfect for small tutorial creators.',
            features: ['Upload up to 5 projects', 'Basic analytics', 'Standard support'],
            icon: <Zap className="w-6 h-6 text-blue-400" />,
            color: 'blue'
        },
        {
            name: 'Pro Admin',
            price: '$79',
            period: '/month',
            description: 'For growing education platforms.',
            features: ['Unlimited uploads', 'Advanced analytics', 'Priority support', 'Custom branding'],
            icon: <Shield className="w-6 h-6 text-sky-400" />,
            color: 'sky',
            popular: true
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            description: 'Full-scale institutional solution.',
            features: ['SLA guarantees', 'Dedicated manager', 'API access', 'Whitelabeling'],
            icon: <Crown className="w-6 h-6 text-indigo-400" />,
            color: 'indigo'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-900 py-20 px-4">
            <div className="max-w-6xl mx-auto text-center mb-16">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold text-text-primary mb-4"
                >
                    Choose Your Admin Plan
                </motion.h1>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-400 text-lg flex items-center justify-center gap-2"
                >
                    Get started with the powerful <XPulseLogo textClassName="text-lg font-bold" iconClassName="w-5 h-5" /> administrative tools.
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative bg-surface-100 border ${plan.popular ? 'border-sky-500 shadow-lg shadow-sky-500/10' : 'border-border-glass'} rounded-3xl p-8 backdrop-blur-sm flex flex-col`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sky-500 text-text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <div className="w-12 h-12 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
                                {plan.icon}
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-text-primary">{plan.price}</span>
                                <span className="text-gray-400 text-sm font-medium">{plan.period}</span>
                            </div>
                            <p className="text-gray-400 text-sm mt-4">{plan.description}</p>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            {plan.features.map(feature => (
                                <div key={feature} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <span className="text-sm text-gray-300">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate('/admin')}
                            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${plan.popular
                                    ? 'bg-sky-500 text-text-primary hover:bg-sky-600 shadow-lg shadow-sky-500/20'
                                    : 'bg-surface-100 text-text-primary hover:bg-surface-200 border border-border-glass'
                                }`}
                        >
                            Select Plan
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <button
                    onClick={() => navigate('/admin')}
                    className="text-gray-500 hover:text-text-primary text-sm transition-colors"
                >
                    Continue with Free Draft Mode (Limited) →
                </button>
            </div>
        </div>
    );
}
