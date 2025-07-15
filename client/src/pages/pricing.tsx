import { useState } from 'react';
import { useAuth } from '@/lib/auth.tsx';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CheckCircle, PlaneTakeoff, Crown, Building2, Zap } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  interval: string;
  maxInvoices: number;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
  description: string;
  priceId?: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    maxInvoices: 3,
    description: 'Perfect for getting started',
    icon: PlaneTakeoff,
    features: [
      'Up to 3 invoices',
      'Basic email nudges',
      'Standard templates',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    interval: 'month',
    maxInvoices: 50,
    description: 'Great for growing businesses',
    icon: CheckCircle,
    popular: true,
    features: [
      'Up to 50 invoices',
      'Advanced nudge scheduling',
      'Custom email templates',
      'Business hours settings',
      'Email analytics',
    ],
    priceId: 'price_pro_monthly',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: 49,
    interval: 'month',
    maxInvoices: 1000,
    description: 'For established businesses',
    icon: Crown,
    features: [
      'Up to 1,000 invoices',
      'Advanced automation rules',
      'Custom branding',
      'Priority email support',
      'Advanced analytics',
      'API access',
    ],
    priceId: 'price_platinum_monthly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 139,
    interval: 'month',
    maxInvoices: 5000,
    description: 'For large organizations',
    icon: Building2,
    features: [
      'Up to 5,000 invoices',
      'Team collaboration',
      'Advanced reporting',
      'Custom integrations',
      'Dedicated account manager',
      'Phone support',
    ],
    priceId: 'price_enterprise_monthly',
  },
  {
    id: 'unlimited',
    name: 'Free Flow',
    price: 220,
    interval: 'month',
    maxInvoices: -1, // Unlimited
    description: 'No limits, maximum freedom',
    icon: Zap,
    features: [
      'Unlimited invoices',
      'All features included',
      'White-label solution',
      'Custom development',
      'Premium support',
      'SLA guarantee',
    ],
    priceId: 'price_unlimited_monthly',
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: PricingTier) => {
    if (!user) {
      setLocation('/login');
      return;
    }

    if (tier.id === 'free') {
      setLocation('/dashboard');
      return;
    }

    setSelectedTier(tier.id);
    setLocation(`/subscribe?tier=${tier.id}`);
  };

  const currentTier = user?.subscriptionTier || 'free';

  return (
    <div className="min-h-screen bg-slate-50">
      {user ? (
        <div className="flex h-screen bg-slate-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header title="Pricing Plans" subtitle="Choose the perfect plan for your business" />
            <main className="flex-1 overflow-y-auto bg-slate-50">
              <div className="p-6">
                <PricingGrid 
                  tiers={pricingTiers} 
                  currentTier={currentTier}
                  onSubscribe={handleSubscribe}
                  selectedTier={selectedTier}
                />
              </div>
            </main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <PlaneTakeoff className="text-white w-4 h-4" />
                  </div>
                  <span className="text-xl font-semibold text-slate-900">Flow</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={() => setLocation('/login')}>
                    Login
                  </Button>
                  <Button onClick={() => setLocation('/signup')}>
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </header>
          
          <main className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">
                  Simple, Transparent Pricing
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  Choose the plan that fits your business needs. Start free and upgrade as you grow.
                </p>
              </div>
              
              <PricingGrid 
                tiers={pricingTiers} 
                currentTier={currentTier}
                onSubscribe={handleSubscribe}
                selectedTier={selectedTier}
              />
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

interface PricingGridProps {
  tiers: PricingTier[];
  currentTier: string;
  onSubscribe: (tier: PricingTier) => void;
  selectedTier: string | null;
}

function PricingGrid({ tiers, currentTier, onSubscribe, selectedTier }: PricingGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
      {tiers.map((tier) => {
        const Icon = tier.icon;
        const isCurrentTier = currentTier === tier.id;
        const isProcessing = selectedTier === tier.id;
        
        return (
          <Card 
            key={tier.id} 
            className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
              tier.popular ? 'border-primary shadow-lg scale-105' : ''
            } ${isCurrentTier ? 'ring-2 ring-primary' : ''}`}
          >
            {tier.popular && (
              <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                Most Popular
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  tier.popular ? 'bg-primary' : 'bg-slate-100'
                }`}>
                  <Icon className={`w-6 h-6 ${tier.popular ? 'text-white' : 'text-slate-600'}`} />
                </div>
              </div>
              
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <p className="text-sm text-slate-600 mt-1">{tier.description}</p>
              
              <div className="mt-4">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-slate-900">
                    ${tier.price}
                  </span>
                  <span className="text-slate-600 ml-2">
                    /{tier.interval}
                  </span>
                </div>
                <div className="mt-2">
                  <Badge variant={isCurrentTier ? "default" : "secondary"}>
                    {tier.maxInvoices === -1 ? 'Unlimited' : `${tier.maxInvoices}`} invoices
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                className="w-full" 
                variant={isCurrentTier ? "secondary" : tier.popular ? "default" : "outline"}
                onClick={() => onSubscribe(tier)}
                disabled={isCurrentTier || isProcessing}
              >
                {isProcessing ? 'Processing...' : 
                 isCurrentTier ? 'Current Plan' : 
                 tier.id === 'free' ? 'Get Started' : 
                 'Upgrade'}
              </Button>
              
              {tier.id !== 'free' && (
                <p className="text-xs text-slate-500 text-center mt-2">
                  Cancel anytime
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}