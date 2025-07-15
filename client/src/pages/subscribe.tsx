import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth.tsx';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CheckCircle, PlaneTakeoff } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: `Welcome to Flow ${selectedTier.name}! You now have access to enhanced features.`,
      });
      setLocation('/dashboard');
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : `Subscribe to ${selectedTier?.name || 'Pro'} - $${selectedTier?.price || 19}/month`}
      </Button>
    </form>
  );
};

const pricingTiers = {
  pro: { name: 'Pro', price: 19, maxInvoices: 50 },
  platinum: { name: 'Platinum', price: 49, maxInvoices: 1000 },
  enterprise: { name: 'Enterprise', price: 139, maxInvoices: 5000 },
  unlimited: { name: 'Free Flow', price: 220, maxInvoices: -1 },
};

export default function Subscribe() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Get tier from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tierParam = urlParams.get('tier') || 'pro';
  const selectedTier = pricingTiers[tierParam as keyof typeof pricingTiers] || pricingTiers.pro;

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
      return;
    }
    
    if (user?.isPro) {
      setLocation('/dashboard');
      return;
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (!user) return;

    // Create subscription as soon as the page loads
    const createSubscription = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-subscription", {
          tier: tierParam,
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Failed to create subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    createSubscription();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isLoading || !clientSecret) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Subscribe to Pro" subtitle="Upgrade your account" />
          <main className="flex-1 overflow-y-auto bg-slate-50">
            <div className="p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Subscribe to Pro" subtitle="Upgrade your account" />
        
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Plan Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <PlaneTakeoff className="text-white w-4 h-4" />
                    </div>
                    <span>Flow {selectedTier.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <p className="text-3xl font-bold text-slate-900">${selectedTier.price}</p>
                      <p className="text-slate-600">per month</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="text-sm">
                          {selectedTier.maxInvoices === -1 ? 'Unlimited' : `Up to ${selectedTier.maxInvoices}`} invoices
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="text-sm">Advanced nudge scheduling</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="text-sm">Custom email templates</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="text-sm">Business hours settings</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="text-sm">Email analytics</span>
                      </div>
                      {selectedTier.maxInvoices > 50 && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="text-sm">Priority support</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-xs text-slate-500">
                        Cancel anytime. No long-term commitment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SubscribeForm />
                  </Elements>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
