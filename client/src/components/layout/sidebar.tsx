import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth.tsx';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  Bell, 
  Settings, 
  CreditCard, 
  LogOut,
  PlaneTakeoff,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/pricing', icon: Crown, label: 'Pricing' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-slate-200 h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <PlaneTakeoff className="text-white w-4 h-4" />
          </div>
          <span className="text-xl font-semibold text-slate-900">Flow</span>
        </div>
      </div>
      
      <nav className="flex-1">
        <div className="px-6 py-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Main</span>
        </div>
        <div className="mt-2 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <a className={cn(
                "group flex items-center px-6 py-3 text-sm font-medium transition-colors",
                location === href 
                  ? "bg-primary text-white"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              )}>
                <Icon className="mr-3 h-4 w-4" />
                {label}
              </a>
            </Link>
          ))}
        </div>
      </nav>
      
      <div className="p-6 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.businessName || user?.email}
            </p>
            <p className="text-xs text-slate-500">
              {user?.isPro ? 'Pro Plan' : 'Free Plan'}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
