import { Check, Zap, Shield, Rocket } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'

const plans = [
  {
    id: 'free',
    name: 'Free',
    priceUSD: '$0',
    priceINR: '₹0',
    description: 'Get started with optimization',
    icon: Zap,
    features: [
      '1 API key',
      '2 requests/day',
      'Basic solver access',
      'Community support',
    ],
    cta: 'Sign Up Free',
    href: '/signup',
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    priceUSD: '$4.99',
    priceINR: '₹399',
    description: 'For individual developers',
    icon: Rocket,
    features: [
      'Unlimited API keys',
      'Unlimited requests',
      'All solver methods',
      'Email support',
    ],
    cta: 'Get Starter',
    href: '/signup',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUSD: '$9.99',
    priceINR: '₹999',
    description: 'For power users',
    icon: Shield,
    features: [
      'Unlimited API keys',
      'Unlimited requests',
      'Priority support',
      'Advanced analytics',
      'Custom rate limits',
    ],
    cta: 'Get Pro',
    href: '/signup',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceUSD: '$19.99',
    priceINR: '₹1,999',
    description: 'For teams and businesses',
    icon: Zap,
    features: [
      'Everything in Pro',
      'Dedicated infrastructure',
      'SLA guarantee',
      'Custom integrations',
      'Phone support',
    ],
    cta: 'Contact Sales',
    href: '/signup',
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-[clamp(32px,5vw,56px)] font-semibold leading-[1.05] text-ink -tracking-[0.04em] mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-ink-muted max-w-lg mx-auto">
          Start free. Upgrade when you need more power.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col gap-4 ${plan.highlighted ? 'border-accent/50 bg-surface-2' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${plan.highlighted ? 'bg-accent-soft' : 'bg-surface-2'}`}>
                <plan.icon size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">{plan.name}</h3>
                <p className="text-xs text-ink-tertiary">{plan.description}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-ink font-mono">{plan.priceUSD}</span>
              <span className="text-sm text-ink-muted">/mo</span>
            </div>
            <p className="text-xs text-ink-tertiary font-mono">{plan.priceINR}/mo</p>

            <ul className="space-y-2 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-ink-muted">
                  <Check size={14} className="text-success mt-0.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              variant={plan.highlighted ? 'primary' : 'secondary'}
              size="sm"
              className="w-full"
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-ink-tertiary">
          All plans include SSL encryption, API versioning, and 99.9% uptime SLA.
        </p>
      </div>
    </div>
  )
}
