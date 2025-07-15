import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AddInvoiceModal } from '../invoice/add-invoice-modal';
import { NotificationSystem } from '../notifications/notification-system';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddInvoice?: boolean;
}

export function Header({ title, subtitle, showAddInvoice = false }: HeaderProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-slate-600">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {showAddInvoice && (
                <Button 
                  onClick={() => setShowModal(true)}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Invoice
                </Button>
              )}
              <NotificationSystem />
            </div>
          </div>
        </div>
      </header>
      
      {showModal && (
        <AddInvoiceModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
