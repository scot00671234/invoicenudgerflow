import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth.tsx';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { InvoiceTable } from '@/components/invoice/invoice-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function Invoices() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [user, authLoading, setLocation]);

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
          title="Invoices" 
          subtitle="Manage your invoices and track payments"
          showAddInvoice
        />
        
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6">
            {invoicesLoading ? (
              <Skeleton className="h-96" />
            ) : (
              <InvoiceTable invoices={invoices} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
