import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Eye, 
  Smartphone, 
  Monitor, 
  Tablet,
  MessageSquare,
  Users,
  AlertCircle,
  Info,
  Calendar,
  DollarSign,
  User,
  Building
} from 'lucide-react';

export function EmailPreview() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/email-templates'],
  });

  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Sample invoice data for preview
  const sampleInvoice = {
    invoiceId: 'INV-2024-001',
    clientName: 'John Smith',
    amount: '$2,500.00',
    dueDate: 'March 15, 2024',
    daysPastDue: 5,
    businessName: settings?.user?.businessName || 'Your Business Name',
    unsubscribeLink: 'https://example.com/unsubscribe/token123'
  };

  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{clientName\}\}/g, sampleInvoice.clientName)
      .replace(/\{\{invoiceId\}\}/g, sampleInvoice.invoiceId)
      .replace(/\{\{amount\}\}/g, sampleInvoice.amount)
      .replace(/\{\{dueDate\}\}/g, sampleInvoice.dueDate)
      .replace(/\{\{daysPastDue\}\}/g, sampleInvoice.daysPastDue.toString())
      .replace(/\{\{businessName\}\}/g, sampleInvoice.businessName)
      .replace(/\{\{unsubscribeLink\}\}/g, sampleInvoice.unsubscribeLink);
  };

  const selectedTemplateData = templates.find((t: any) => t.id.toString() === selectedTemplate);

  const getDeviceIcon = () => {
    switch (previewMode) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getDeviceWidth = () => {
    switch (previewMode) {
      case 'mobile': return 'max-w-sm';
      case 'tablet': return 'max-w-md';
      default: return 'max-w-2xl';
    }
  };

  const toneConfig = {
    friendly: {
      color: 'bg-blue-100 text-blue-800',
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Polite and understanding tone'
    },
    professional: {
      color: 'bg-green-100 text-green-800',
      icon: <Users className="h-4 w-4" />,
      description: 'Business-like tone'
    },
    firm: {
      color: 'bg-orange-100 text-orange-800',
      icon: <AlertCircle className="h-4 w-4" />,
      description: 'Direct tone for overdue payments'
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Email Preview
          </CardTitle>
          <CardDescription>
            See how your email templates will look to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template to preview" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name} - {template.tone} (Nudge {template.nudgeNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {templates.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No templates found. Create your first template to see the preview.
              </AlertDescription>
            </Alert>
          )}

          {!selectedTemplate && templates.length > 0 && (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                Select a template above to see how it will look to your customers.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedTemplateData && (
        <div className="space-y-4">
          {/* Template Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge className={toneConfig[selectedTemplateData.tone as keyof typeof toneConfig].color}>
                    {toneConfig[selectedTemplateData.tone as keyof typeof toneConfig].icon}
                    <span className="ml-1 capitalize">{selectedTemplateData.tone}</span>
                  </Badge>
                  <Badge variant="outline">
                    Nudge {selectedTemplateData.nudgeNumber}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getDeviceIcon()}
                  <span className="capitalize">{previewMode} Preview</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>To: {sampleInvoice.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>From: {sampleInvoice.businessName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Amount: {sampleInvoice.amount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due: {sampleInvoice.dueDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className={`${getDeviceWidth()} mx-auto`}>
                  {/* Email Header */}
                  <div className="bg-gray-50 p-4 rounded-t-lg border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-800">
                        {settings?.user?.smtpFromName || sampleInvoice.businessName}
                      </span>
                      <span className="text-gray-500">
                        &lt;{settings?.user?.smtpUser || 'your-email@example.com'}&gt;
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">To:</span> {sampleInvoice.clientName} &lt;{sampleInvoice.clientName.toLowerCase().replace(' ', '.')}@example.com&gt;
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Subject:</span> {replaceVariables(selectedTemplateData.subject)}
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="bg-white p-6 rounded-b-lg border border-t-0 shadow-sm">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {replaceVariables(selectedTemplateData.body)}
                      </div>
                    </div>
                  </div>

                  {/* Email Footer */}
                  <div className="bg-gray-50 p-3 rounded-b-lg text-xs text-gray-500 text-center mt-2">
                    <p>This email was sent by {sampleInvoice.businessName} via Flow Invoice Automation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Variables Used */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Variables Used</CardTitle>
              <CardDescription>
                These variables will be replaced with actual invoice data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <code className="text-blue-600">{"{{clientName}}"}</code>
                  <span className="text-gray-600">→ {sampleInvoice.clientName}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <code className="text-blue-600">{"{{invoiceId}}"}</code>
                  <span className="text-gray-600">→ {sampleInvoice.invoiceId}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <code className="text-blue-600">{"{{amount}}"}</code>
                  <span className="text-gray-600">→ {sampleInvoice.amount}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <code className="text-blue-600">{"{{dueDate}}"}</code>
                  <span className="text-gray-600">→ {sampleInvoice.dueDate}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <code className="text-blue-600">{"{{daysPastDue}}"}</code>
                  <span className="text-gray-600">→ {sampleInvoice.daysPastDue}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <code className="text-blue-600">{"{{businessName}}"}</code>
                  <span className="text-gray-600">→ {sampleInvoice.businessName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}