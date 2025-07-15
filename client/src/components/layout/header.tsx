import { Button } from '@/components/ui/button';
import { Bell, Plus } from 'lucide-react';
import { useState } from 'react';
import { AddInvoiceModal } from '../invoice/add-invoice-modal';

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
              <div className="relative">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-white text-xs flex items-center justify-center">
                    3
                  </span>
                </Button>
              </div>
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
