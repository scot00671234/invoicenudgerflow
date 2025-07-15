import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaneTakeoff, CheckCircle, Clock, Mail } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
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
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Automate Your Invoice
            <span className="text-primary"> Follow-ups</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Stop chasing late payments manually. Flow sends intelligent, 
            scheduled nudges to your clients so you get paid faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything you need to get paid faster
            </h2>
            <p className="text-xl text-slate-600">
              Simple, automated invoice follow-ups that work
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Smart Nudges
                </h3>
                <p className="text-slate-600">
                  Automatically send follow-up emails 1 day after due date, 
                  then every 3-7 days until paid.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Easy Setup
                </h3>
                <p className="text-slate-600">
                  Upload invoices via CSV, connect your accounting software, 
                  or add them manually.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Time Saving
                </h3>
                <p className="text-slate-600">
                  Stop manually tracking overdue invoices. Let Flow handle 
                  the follow-ups automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-600">
              Start for free, upgrade when you grow
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
                  <p className="text-slate-600 text-sm mb-4">Perfect for getting started</p>
                  <p className="text-4xl font-bold text-slate-900">$0</p>
                  <p className="text-slate-600">/month</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Up to 3 invoices</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Basic email nudges</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Standard templates</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className="w-full" variant="outline">
                    Current Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="p-6 border-primary">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
                  <p className="text-slate-600 text-sm mb-4">Great for growing businesses</p>
                  <p className="text-4xl font-bold text-slate-900">$19</p>
                  <p className="text-slate-600">/month</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Up to 50 invoices</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Advanced nudge scheduling</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Custom email templates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Business hours settings</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Email analytics</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className="w-full">
                    Upgrade
                  </Button>
                </Link>
                <p className="text-xs text-slate-500 mt-2 text-center">Cancel anytime</p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Scale</h3>
                  <p className="text-slate-600 text-sm mb-4">For established businesses</p>
                  <p className="text-4xl font-bold text-slate-900">$49</p>
                  <p className="text-slate-600">/month</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Up to 1,000 invoices</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Advanced automation rules</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Custom branding</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Advanced analytics</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className="w-full">
                    Upgrade
                  </Button>
                </Link>
                <p className="text-xs text-slate-500 mt-2 text-center">Cancel anytime</p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
                  <p className="text-slate-600 text-sm mb-4">For large organizations</p>
                  <p className="text-4xl font-bold text-slate-900">$139</p>
                  <p className="text-slate-600">/month</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Up to 5,000 invoices</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Advanced reporting</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Custom integrations</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className="w-full">
                    Upgrade
                  </Button>
                </Link>
                <p className="text-xs text-slate-500 mt-2 text-center">Cancel anytime</p>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-primary">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Platinum</h3>
                  <p className="text-slate-600 text-sm mb-4">No limits, maximum freedom</p>
                  <p className="text-4xl font-bold text-slate-900">$220</p>
                  <p className="text-slate-600">/month</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Unlimited invoices</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">All features included</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">White-label solution</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Custom development</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">Premium support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success mr-2" />
                    <span className="text-sm">SLA guarantee</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className="w-full">
                    Upgrade
                  </Button>
                </Link>
                <p className="text-xs text-slate-500 mt-2 text-center">Cancel anytime</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <PlaneTakeoff className="text-white w-3 h-3" />
              </div>
              <span className="text-lg font-semibold text-slate-900">Flow</span>
            </div>
            <p className="text-slate-600">
              © 2024 Flow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
