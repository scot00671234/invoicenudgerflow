import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailTemplateEditor } from '@/components/email/email-template-editor';
import { X, Mail, Settings } from 'lucide-react';

interface AddInvoiceModalProps {
  onClose: () => void;
}

export function AddInvoiceModal({ onClose }: AddInvoiceModalProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    invoiceId: '',
    amount: '',
    dueDate: '',
    nudgeActive: true,
  });
  
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/invoices', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice Created",
        description: "Invoice has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoiceMutation.mutate({
      ...formData,
      amount: formData.amount, // Keep as string for backend validation
      dueDate: formData.dueDate, // Keep as string for backend validation
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Invoice</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              placeholder="Enter client name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="clientEmail">Client Email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => handleInputChange('clientEmail', e.target.value)}
              placeholder="client@company.com"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="invoiceId">Invoice ID</Label>
            <Input
              id="invoiceId"
              value={formData.invoiceId}
              onChange={(e) => handleInputChange('invoiceId', e.target.value)}
              placeholder="#1234"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                required
              />
            </div>
          </div>
          
          {/* Email Automation Settings */}
          <Card className="p-4 border-2 border-dashed border-primary/20">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Automation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nudgeActive"
                  checked={formData.nudgeActive}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, nudgeActive: !!checked })
                  }
                />
                <Label htmlFor="nudgeActive" className="text-sm">
                  Enable automatic follow-up emails for this invoice
                </Label>
              </div>
              
              {formData.nudgeActive && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Smart Email Reminders</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically send follow-up emails when invoice becomes overdue
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplateEditor(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Templates
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? 'Creating...' : 'Add Invoice'}
            </Button>
          </div>
        </form>
        
        {/* Template Editor Modal */}
        {showTemplateEditor && (
          <EmailTemplateEditor
            isOpen={showTemplateEditor}
            onClose={() => setShowTemplateEditor(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
