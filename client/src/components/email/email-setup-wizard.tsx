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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  Info, 
  ArrowRight, 
  Settings, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Server,
  Clock,
  Users,
  FileText
} from 'lucide-react';

interface EmailSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
}

export function EmailSetupWizard({ isOpen, onClose, initialStep = 0 }: EmailSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [setupData, setSetupData] = useState({
    // SMTP Settings
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFromName: '',
    
    // Nudge Settings
    nudgeEnabled: true,
    firstNudgeDelay: 1,
    nudgeInterval: 3,
    businessHoursOnly: true,
    businessStartHour: 9,
    businessEndHour: 17,
    weekdaysOnly: true,
    
    // Templates
    templates: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
    enabled: isOpen,
    onSuccess: (data) => {
      setSetupData(prev => ({
        ...prev,
        smtpHost: data.user.smtpHost || '',
        smtpPort: data.user.smtpPort || 587,
        smtpUser: data.user.smtpUser || '',
        smtpPass: data.user.smtpPass || '',
        smtpFromName: data.user.smtpFromName || '',
        nudgeEnabled: data.user.nudgeEnabled ?? true,
        firstNudgeDelay: data.user.firstNudgeDelay || 1,
        nudgeInterval: data.user.nudgeInterval || 3,
        businessHoursOnly: data.user.businessHoursOnly ?? true,
        businessStartHour: data.user.businessStartHour || 9,
        businessEndHour: data.user.businessEndHour || 17,
        weekdaysOnly: data.user.weekdaysOnly ?? true,
      }));
    },
  });

  const { data: templates } = useQuery({
    queryKey: ['/api/email-templates'],
    enabled: isOpen,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', '/api/settings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  const testSmtpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/test-smtp', {
        smtpHost: setupData.smtpHost,
        smtpPort: setupData.smtpPort,
        smtpUser: setupData.smtpUser,
        smtpPass: setupData.smtpPass,
        smtpFromName: setupData.smtpFromName,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMTP Test Successful",
        description: "Your email configuration is working correctly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "SMTP Test Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const steps = [
    {
      title: "Email Server Setup",
      description: "Configure your SMTP settings",
      icon: <Server className="h-5 w-5" />,
      isComplete: !!(setupData.smtpHost && setupData.smtpUser && setupData.smtpPass)
    },
    {
      title: "Automation Settings",
      description: "Set up nudge timing and rules",
      icon: <Clock className="h-5 w-5" />,
      isComplete: true // Always complete as it has defaults
    },
    {
      title: "Email Templates",
      description: "Create your email templates",
      icon: <FileText className="h-5 w-5" />,
      isComplete: templates && templates.length > 0
    },
    {
      title: "Review & Test",
      description: "Test your setup",
      icon: <CheckCircle className="h-5 w-5" />,
      isComplete: false
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveAndNext = async () => {
    await updateSettingsMutation.mutateAsync(setupData);
    handleNext();
  };

  const handleFinish = async () => {
    await updateSettingsMutation.mutateAsync(setupData);
    toast({
      title: "Setup Complete",
      description: "Your email automation system is now configured and ready to use.",
    });
    onClose();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Automation Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index < currentStep || step.isComplete
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {step.isComplete && index !== currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.icon
                )}
                <div className="hidden sm:block">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs opacity-75">{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    SMTP Email Server Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your email server settings to send automated invoice reminders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You'll need your email provider's SMTP settings. For Gmail, use smtp.gmail.com with port 587 and an app password.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={setupData.smtpHost}
                        onChange={(e) => setSetupData({ ...setupData, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={setupData.smtpPort}
                        onChange={(e) => setSetupData({ ...setupData, smtpPort: parseInt(e.target.value) })}
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpUser">Email Address</Label>
                      <Input
                        id="smtpUser"
                        type="email"
                        value={setupData.smtpUser}
                        onChange={(e) => setSetupData({ ...setupData, smtpUser: e.target.value })}
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPass">App Password</Label>
                      <Input
                        id="smtpPass"
                        type="password"
                        value={setupData.smtpPass}
                        onChange={(e) => setSetupData({ ...setupData, smtpPass: e.target.value })}
                        placeholder="your-app-password"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="smtpFromName">Your Business Name</Label>
                    <Input
                      id="smtpFromName"
                      value={setupData.smtpFromName}
                      onChange={(e) => setSetupData({ ...setupData, smtpFromName: e.target.value })}
                      placeholder="Your Business Name"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testSmtpMutation.mutate()}
                      disabled={testSmtpMutation.isPending || !setupData.smtpHost || !setupData.smtpUser}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {testSmtpMutation.isPending ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Automation Settings
                  </CardTitle>
                  <CardDescription>
                    Configure when and how often to send payment reminders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="nudgeEnabled">Enable Automated Nudges</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically send payment reminders for overdue invoices
                      </p>
                    </div>
                    <Switch
                      id="nudgeEnabled"
                      checked={setupData.nudgeEnabled}
                      onCheckedChange={(checked) => setSetupData({ ...setupData, nudgeEnabled: checked })}
                    />
                  </div>

                  {setupData.nudgeEnabled && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstNudgeDelay">First Nudge Delay</Label>
                          <Select
                            value={setupData.firstNudgeDelay.toString()}
                            onValueChange={(value) => setSetupData({ ...setupData, firstNudgeDelay: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Same day as due date</SelectItem>
                              <SelectItem value="1">1 day after due date</SelectItem>
                              <SelectItem value="2">2 days after due date</SelectItem>
                              <SelectItem value="3">3 days after due date</SelectItem>
                              <SelectItem value="7">1 week after due date</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="nudgeInterval">Nudge Interval</Label>
                          <Select
                            value={setupData.nudgeInterval.toString()}
                            onValueChange={(value) => setSetupData({ ...setupData, nudgeInterval: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Every day</SelectItem>
                              <SelectItem value="2">Every 2 days</SelectItem>
                              <SelectItem value="3">Every 3 days</SelectItem>
                              <SelectItem value="7">Every week</SelectItem>
                              <SelectItem value="14">Every 2 weeks</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="businessHoursOnly">Business Hours Only</Label>
                            <p className="text-sm text-muted-foreground">
                              Only send nudges during business hours
                            </p>
                          </div>
                          <Switch
                            id="businessHoursOnly"
                            checked={setupData.businessHoursOnly}
                            onCheckedChange={(checked) => setSetupData({ ...setupData, businessHoursOnly: checked })}
                          />
                        </div>

                        {setupData.businessHoursOnly && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="businessStartHour">Start Hour</Label>
                              <Select
                                value={setupData.businessStartHour.toString()}
                                onValueChange={(value) => setSetupData({ ...setupData, businessStartHour: parseInt(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                      {i.toString().padStart(2, '0')}:00
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="businessEndHour">End Hour</Label>
                              <Select
                                value={setupData.businessEndHour.toString()}
                                onValueChange={(value) => setSetupData({ ...setupData, businessEndHour: parseInt(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                      {i.toString().padStart(2, '0')}:00
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="weekdaysOnly">Weekdays Only</Label>
                            <p className="text-sm text-muted-foreground">
                              Only send nudges on weekdays (Monday-Friday)
                            </p>
                          </div>
                          <Switch
                            id="weekdaysOnly"
                            checked={setupData.weekdaysOnly}
                            onCheckedChange={(checked) => setSetupData({ ...setupData, weekdaysOnly: checked })}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Email Templates
                  </CardTitle>
                  <CardDescription>
                    Create templates for different types of payment reminders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Templates allow you to customize your payment reminder messages. You can create different tones for different situations.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <h3 className="font-medium">Friendly</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Polite and understanding tone for regular clients
                      </p>
                      <Button variant="outline" size="sm">
                        Create Template
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-green-500" />
                        <h3 className="font-medium">Professional</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Business-like tone for corporate clients
                      </p>
                      <Button variant="outline" size="sm">
                        Create Template
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-orange-500" />
                        <h3 className="font-medium">Firm</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Direct tone for overdue payments
                      </p>
                      <Button variant="outline" size="sm">
                        Create Template
                      </Button>
                    </Card>
                  </div>

                  {templates && templates.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Your Templates</h4>
                      <div className="space-y-2">
                        {templates.map((template: any) => (
                          <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <span className="font-medium">{template.name}</span>
                              <Badge variant="secondary" className="ml-2">
                                {template.tone}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Review & Test Your Setup
                  </CardTitle>
                  <CardDescription>
                    Review your configuration and test the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Email Server</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>SMTP Host:</span>
                          <span>{setupData.smtpHost || 'Not configured'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span>{setupData.smtpUser || 'Not configured'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>From Name:</span>
                          <span>{setupData.smtpFromName || 'Not configured'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Automation Settings</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Nudges Enabled:</span>
                          <span>{setupData.nudgeEnabled ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>First Nudge:</span>
                          <span>{setupData.firstNudgeDelay} days after due</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nudge Interval:</span>
                          <span>Every {setupData.nudgeInterval} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Business Hours:</span>
                          <span>{setupData.businessHoursOnly ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => testSmtpMutation.mutate()}
                      disabled={testSmtpMutation.isPending}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {testSmtpMutation.isPending ? 'Testing...' : 'Test Email'}
                    </Button>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your email automation system is ready! Once you finish setup, invoice reminders will be sent automatically based on your settings.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleSaveAndNext}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save & Continue'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? 'Finishing...' : 'Finish Setup'}
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}