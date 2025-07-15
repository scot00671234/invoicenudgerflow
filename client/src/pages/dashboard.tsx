import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth.tsx';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { UpcomingNudges } from '@/components/dashboard/upcoming-nudges';
import { InvoiceTable } from '@/components/invoice/invoice-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [user, authLoading, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!user,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/invoices'],
    enabled: !!user,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard" 
          subtitle="Overview of your invoice activity"
          showAddInvoice
        />
        
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6">
            {/* Stats Cards */}
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : stats ? (
              <StatsCards stats={stats} />
            ) : null}

            {/* Recent Activity & Upcoming Nudges */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RecentActivity />
              <UpcomingNudges />
            </div>

            {/* Recent Invoices Table */}
            {invoicesLoading ? (
              <Skeleton className="h-96" />
            ) : (
              <InvoiceTable invoices={invoices.slice(0, 10)} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
