import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  Copy, 
  Eye,
  MessageSquare,
  Info,
  Lightbulb,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';

interface EmailTemplate {
  id: number;
  name: string;
  tone: 'friendly' | 'professional' | 'firm';
  nudgeNumber: number;
  subject: string;
  body: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailTemplateManager({ isOpen, onClose }: EmailTemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
        description: "Your email template has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
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
        description: "Your email template has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setIsEditing(false);
      setSelectedTemplate(null);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/email-templates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "Your email template has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
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
    setIsEditing(false);
    setSelectedTemplate(null);
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

  const handleSave = () => {
    if (isEditing && selectedTemplate) {
      updateTemplateMutation.mutate({
        id: selectedTemplate.id,
        data: formData,
      });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const handleCreateFromTemplate = (tone: string) => {
    const defaultTemplates = {
      friendly: {
        name: `Friendly Reminder - Nudge 1`,
        subject: 'Friendly Reminder: Invoice {{invoiceId}} Payment Due',
        body: `Hi {{clientName}},

I hope this email finds you well! I wanted to send you a friendly reminder that invoice {{invoiceId}} for {{amount}} was due on {{dueDate}}.

I understand things can get busy, and if you've already sent the payment, please disregard this message. If you haven't had a chance to process it yet, I'd greatly appreciate it if you could arrange payment at your earliest convenience.

If you have any questions about the invoice or need to discuss payment arrangements, please don't hesitate to reach out. I'm here to help!

Thank you for your business and continued partnership.

Best regards,
{{businessName}}

---
You can unsubscribe from these reminders by clicking here: {{unsubscribeLink}}`
      },
      professional: {
        name: `Professional Reminder - Nudge 1`,
        subject: 'Payment Reminder: Invoice {{invoiceId}} - Due {{dueDate}}',
        body: `Dear {{clientName}},

This is a professional reminder that invoice {{invoiceId}} in the amount of {{amount}} was due on {{dueDate}}.

Please remit payment at your earliest convenience. If payment has already been sent, please disregard this notice.

For any questions regarding this invoice or to discuss payment arrangements, please contact us immediately.

Thank you for your prompt attention to this matter.

Sincerely,
{{businessName}}

---
To unsubscribe from payment reminders: {{unsubscribeLink}}`
      },
      firm: {
        name: `Firm Reminder - Nudge 2`,
        subject: 'URGENT: Overdue Payment Required - Invoice {{invoiceId}}',
        body: `Dear {{clientName}},

This is a firm reminder that invoice {{invoiceId}} for {{amount}} is now overdue by {{daysPastDue}} days.

Immediate payment is required to avoid further collection action. Please remit payment today or contact us immediately to discuss this matter.

Failure to respond to this notice may result in additional collection efforts and potential damage to your credit rating.

We expect prompt resolution of this matter.

{{businessName}}

---
Unsubscribe: {{unsubscribeLink}}`
      }
    };

    const template = defaultTemplates[tone as keyof typeof defaultTemplates];
    if (template) {
      setFormData({
        name: template.name,
        tone: tone as 'friendly' | 'professional' | 'firm',
        nudgeNumber: tone === 'firm' ? 2 : 1,
        subject: template.subject,
        body: template.body,
      });
      setIsEditing(false);
      setSelectedTemplate(null);
    }
  };

  const previewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const groupedTemplates = templates.reduce((acc: any, template: EmailTemplate) => {
    if (!acc[template.tone]) {
      acc[template.tone] = [];
    }
    acc[template.tone].push(template);
    return acc;
  }, {});

  const toneConfig = {
    friendly: {
      color: 'bg-blue-100 text-blue-800',
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Polite and understanding tone for regular clients'
    },
    professional: {
      color: 'bg-green-100 text-green-800',
      icon: <Users className="h-4 w-4" />,
      description: 'Business-like tone for corporate clients'
    },
    firm: {
      color: 'bg-orange-100 text-orange-800',
      icon: <AlertCircle className="h-4 w-4" />,
      description: 'Direct tone for overdue payments'
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Template Manager
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">My Templates</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid gap-6">
              {Object.entries(toneConfig).map(([tone, config]) => (
                <Card key={tone}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {config.icon}
                      <span className="capitalize">{tone}</span>
                      <Badge className={config.color}>
                        {groupedTemplates[tone]?.length || 0} templates
                      </Badge>
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {groupedTemplates[tone]?.length > 0 ? (
                      <div className="space-y-3">
                        {groupedTemplates[tone].map((template: EmailTemplate) => (
                          <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{template.name}</span>
                                <Badge variant="secondary">
                                  Nudge {template.nudgeNumber}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.subject}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => previewTemplate(template)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(template)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTemplateMutation.mutate(template.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">
                          No {tone} templates yet
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => handleCreateFromTemplate(tone)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create {tone} template
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Friendly Reminder - Nudge 1"
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

                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Payment Reminder: Invoice {{invoiceId}}"
                    />
                  </div>

                  <div>
                    <Label htmlFor="body">Email Body</Label>
                    <Textarea
                      id="body"
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      placeholder="Hi {{clientName}},..."
                      rows={10}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? 'Update' : 'Create'} Template
                    </Button>
                    {isEditing && (
                      <Button variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Template Variables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      Use these variables in your templates. They'll be automatically replaced with actual values when sending emails.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-2 py-1 rounded">{"{{clientName}}"}</code>
                        <span className="text-muted-foreground">Client's name</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-2 py-1 rounded">{"{{invoiceId}}"}</code>
                        <span className="text-muted-foreground">Invoice number</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-2 py-1 rounded">{"{{amount}}"}</code>
                        <span className="text-muted-foreground">Invoice amount</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-2 py-1 rounded">{"{{dueDate}}"}</code>
                        <span className="text-muted-foreground">Due date</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-2 py-1 rounded">{"{{daysPastDue}}"}</code>
                        <span className="text-muted-foreground">Days overdue</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-2 py-1 rounded">{"{{businessName}}"}</code>
                        <span className="text-muted-foreground">Your business name</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-gray-100 px-2 py-1 rounded">{"{{unsubscribeLink}}"}</code>
                        <span className="text-muted-foreground">Unsubscribe link</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Quick Start Templates</h4>
                    <div className="space-y-2">
                      {Object.entries(toneConfig).map(([tone, config]) => (
                        <Button
                          key={tone}
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateFromTemplate(tone)}
                          className="w-full justify-start"
                        >
                          {config.icon}
                          <span className="ml-2 capitalize">{tone} Template</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview Modal */}
        {showPreview && selectedTemplate && (
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Template Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {selectedTemplate.subject}
                  </div>
                </div>
                <div>
                  <Label>Body</Label>
                  <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                    {selectedTemplate.body}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}