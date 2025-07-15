import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Copy, Edit, Trash2, Plus } from 'lucide-react';

interface EmailTemplate {
  id: number;
  name: string;
  tone: 'friendly' | 'professional' | 'firm';
  nudgeNumber: number;
  subject: string;
  body: string;
  isDefault: boolean;
}

interface EmailTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailTemplateEditor({ isOpen, onClose }: EmailTemplateEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tone: 'friendly' as const,
    nudgeNumber: 1,
    subject: '',
    body: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/email-templates'],
    enabled: isOpen,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/email-templates', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Email template has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setIsEditing(false);
      resetForm();
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PATCH', `/api/email-templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "Email template has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setIsEditing(false);
      setSelectedTemplate(null);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/email-templates/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "Email template has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setSelectedTemplate(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      tone: 'friendly',
      nudgeNumber: 1,
      subject: '',
      body: '',
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      tone: template.tone,
      nudgeNumber: template.nudgeNumber,
      subject: template.subject,
      body: template.body,
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data: formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const defaultTemplates = {
    friendly: {
      1: {
        subject: "Friendly reminder: Invoice {{invoiceId}} is now due",
        body: `Hi {{clientName}},

I hope this email finds you well! This is a friendly reminder that Invoice {{invoiceId}} for {{amount}} was due on {{dueDate}}.

If you've already sent payment, please disregard this message. If not, I'd greatly appreciate it if you could process the payment at your earliest convenience.

Please let me know if you have any questions or if there's anything I can help with.

Best regards,
{{businessName}}`
      },
      2: {
        subject: "Second reminder: Invoice {{invoiceId}} - {{amount}}",
        body: `Hi {{clientName}},

I wanted to follow up on Invoice {{invoiceId}} for {{amount}}, which was due on {{dueDate}}.

I understand that sometimes invoices can get overlooked, so I wanted to send a gentle reminder. If you've already processed the payment, thank you! If not, I'd appreciate it if you could take care of it soon.

Please don't hesitate to reach out if you have any questions or concerns.

Best regards,
{{businessName}}`
      },
      3: {
        subject: "Final reminder: Invoice {{invoiceId}} - Action required",
        body: `Hi {{clientName}},

This is my final reminder regarding Invoice {{invoiceId}} for {{amount}}, which was due on {{dueDate}}.

I've sent a couple of previous reminders and haven't received payment yet. I'd really appreciate it if you could process this payment as soon as possible.

If there are any issues or concerns, please let me know so we can resolve them together.

Thank you for your attention to this matter.

Best regards,
{{businessName}}`
      }
    },
    professional: {
      1: {
        subject: "Payment reminder: Invoice {{invoiceId}} - {{amount}}",
        body: `Dear {{clientName}},

This is a reminder that Invoice {{invoiceId}} for {{amount}} was due on {{dueDate}}.

Please remit payment at your earliest convenience. If payment has already been sent, please disregard this notice.

Should you have any questions regarding this invoice, please do not hesitate to contact me.

Thank you for your prompt attention to this matter.

Sincerely,
{{businessName}}`
      },
      2: {
        subject: "Second notice: Invoice {{invoiceId}} - {{amount}}",
        body: `Dear {{clientName}},

This is a second notice regarding Invoice {{invoiceId}} for {{amount}}, which was due on {{dueDate}}.

Please arrange for payment to be processed immediately. If you have already sent payment, please confirm receipt.

If there are any issues with this invoice, please contact me immediately to resolve them.

Thank you for your immediate attention to this matter.

Sincerely,
{{businessName}}`
      },
      3: {
        subject: "Final notice: Invoice {{invoiceId}} - Immediate action required",
        body: `Dear {{clientName}},

This is the final notice regarding Invoice {{invoiceId}} for {{amount}}, which was due on {{dueDate}}.

Payment is now significantly overdue. Please arrange for immediate payment to avoid any disruption to our business relationship.

If payment is not received within 48 hours, we may need to explore other collection options.

Please contact me immediately if there are any issues that need to be resolved.

Sincerely,
{{businessName}}`
      }
    },
    firm: {
      1: {
        subject: "OVERDUE: Invoice {{invoiceId}} - {{amount}}",
        body: `{{clientName}},

Invoice {{invoiceId}} for {{amount}} was due on {{dueDate}} and is now overdue.

Payment is required immediately. Please remit payment within 48 hours to avoid further collection action.

If payment has been sent, please provide confirmation immediately.

{{businessName}}`
      },
      2: {
        subject: "URGENT: Invoice {{invoiceId}} - {{amount}} - Second notice",
        body: `{{clientName}},

Invoice {{invoiceId}} for {{amount}} remains unpaid despite previous notice.

This is your second and final notice before we pursue alternative collection methods.

Payment must be received within 24 hours.

{{businessName}}`
      },
      3: {
        subject: "FINAL NOTICE: Invoice {{invoiceId}} - {{amount}}",
        body: `{{clientName}},

Invoice {{invoiceId}} for {{amount}} is seriously overdue.

This is your final notice. If payment is not received within 24 hours, this matter will be forwarded to our collections department.

Immediate action is required.

{{businessName}}`
      }
    }
  };

  const insertTemplate = (tone: string, nudgeNumber: number) => {
    const template = defaultTemplates[tone as keyof typeof defaultTemplates]?.[nudgeNumber as keyof typeof defaultTemplates.friendly];
    if (template) {
      setFormData({
        ...formData,
        subject: template.subject,
        body: template.body,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Templates</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Templates</h3>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedTemplate(null);
                  resetForm();
                  setIsEditing(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
            
            {isLoading ? (
              <div>Loading templates...</div>
            ) : (
              <div className="space-y-3">
                {templates.map((template: EmailTemplate) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant={template.tone === 'friendly' ? 'default' : template.tone === 'professional' ? 'secondary' : 'destructive'}>
                            {template.tone}
                          </Badge>
                          <Badge variant="outline">
                            Nudge {template.nudgeNumber}
                          </Badge>
                          {template.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.subject}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.body}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Template Editor */}
          <div className="space-y-4">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., First Reminder - Professional"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select
                      value={formData.tone}
                      onValueChange={(value) => setFormData({ ...formData, tone: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="firm">Firm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nudgeNumber">Nudge Number</Label>
                    <Select
                      value={formData.nudgeNumber.toString()}
                      onValueChange={(value) => setFormData({ ...formData, nudgeNumber: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Nudge</SelectItem>
                        <SelectItem value="2">2nd Nudge</SelectItem>
                        <SelectItem value="3">3rd Nudge</SelectItem>
                        <SelectItem value="4">4th Nudge</SelectItem>
                        <SelectItem value="5">5th Nudge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate(formData.tone, formData.nudgeNumber)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Use Default Template
                  </Button>
                </div>

                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Invoice {{invoiceId}} is now due"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Dear {{clientName}},..."
                    rows={10}
                    required
                  />
                </div>

                <Card className="p-4 bg-muted">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-sm">Available Variables</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <code>{'{{clientName}}'}</code>
                      <code>{'{{invoiceId}}'}</code>
                      <code>{'{{amount}}'}</code>
                      <code>{'{{dueDate}}'}</code>
                      <code>{'{{businessName}}'}</code>
                      <code>{'{{overdueDays}}'}</code>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  >
                    {selectedTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedTemplate(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select a template to edit</h3>
                <p className="text-muted-foreground">
                  Choose an existing template or create a new one to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}