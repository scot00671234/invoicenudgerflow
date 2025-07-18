import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth.tsx';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SmtpSettings } from '@/components/settings/smtp-settings';
import { EmailTemplateEditor } from '@/components/email/email-template-editor';
import { EmailSetupWizard } from '@/components/email/email-setup-wizard';
import { EmailTemplateManager } from '@/components/email/email-template-manager';
import { EmailPreview } from '@/components/email/email-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, FileText, CreditCard, Settings as SettingsIcon, MessageSquare, Users } from 'lucide-react';

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    timezone: '',
    messageTone: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [user, authLoading, setLocation]);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/settings'],
    enabled: !!user,
    onSuccess: (data) => {
      setFormData({
        businessName: data.user.businessName || '',
        timezone: data.user.timezone || 'UTC',
        messageTone: data.user.messageTone || 'friendly',
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', '/api/settings', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/cancel-subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Header title="Settings" subtitle="Manage your account and preferences" />
          
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {settingsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/4" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Billing
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Business Settings</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Configure your business information and preferences
                        </p>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="businessName">Business Name</Label>
                            <Input
                              id="businessName"
                              value={formData.businessName}
                              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                              placeholder="Your Business Name"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select 
                              value={formData.timezone} 
                              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="US/Eastern">US/Eastern</SelectItem>
                                <SelectItem value="US/Central">US/Central</SelectItem>
                                <SelectItem value="US/Mountain">US/Mountain</SelectItem>
                                <SelectItem value="US/Pacific">US/Pacific</SelectItem>
                                <SelectItem value="Europe/London">Europe/London</SelectItem>
                                <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                                <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="messageTone">Default Message Tone</Label>
                            <Select 
                              value={formData.messageTone} 
                              onValueChange={(value) => setFormData({ ...formData, messageTone: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select message tone" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="firm">Firm</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button 
                            type="submit" 
                            disabled={updateSettingsMutation.isPending}
                          >
                            {updateSettingsMutation.isPending ? 'Updating...' : 'Update Settings'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="email" className="space-y-6">
                    <Tabs defaultValue="setup" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="setup">Setup</TabsTrigger>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>

                      <TabsContent value="setup" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Email Automation Quick Setup</CardTitle>
                            <CardDescription>
                              Set up your email automation system in a few simple steps
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Button 
                                onClick={() => setShowSetupWizard(true)}
                                className="h-20 flex-col space-y-2"
                              >
                                <SettingsIcon className="h-6 w-6" />
                                <span>Setup Wizard</span>
                                <span className="text-xs opacity-80">Configure email automation</span>
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => setShowTemplateManager(true)}
                                className="h-20 flex-col space-y-2"
                              >
                                <FileText className="h-6 w-6" />
                                <span>Manage Templates</span>
                                <span className="text-xs opacity-80">Create & edit email templates</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <SmtpSettings />
                      </TabsContent>

                      <TabsContent value="templates" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Email Templates</CardTitle>
                            <CardDescription>
                              Create and manage email templates for different nudge types
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="h-5 w-5 text-blue-500" />
                                  <h3 className="font-medium">Friendly Templates</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Polite and understanding tone for regular clients
                                </p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setShowTemplateManager(true)}
                                >
                                  Manage
                                </Button>
                              </div>

                              <div className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="h-5 w-5 text-green-500" />
                                  <h3 className="font-medium">Professional Templates</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Business-like tone for corporate clients
                                </p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setShowTemplateManager(true)}
                                >
                                  Manage
                                </Button>
                              </div>

                              <div className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <CreditCard className="h-5 w-5 text-orange-500" />
                                  <h3 className="font-medium">Firm Templates</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Direct tone for overdue payments
                                </p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setShowTemplateManager(true)}
                                >
                                  Manage
                                </Button>
                              </div>
                            </div>

                            <div className="pt-4 border-t">
                              <Button onClick={() => setShowTemplateManager(true)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Open Template Manager
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="preview" className="space-y-6">
                        <EmailPreview />
                      </TabsContent>
                    </Tabs>
                  </TabsContent>



                  <TabsContent value="billing" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Subscription</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Manage your billing and subscription settings
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label>Current Plan</Label>
                            <p className="text-sm text-slate-600">
                              {user.isPro ? 'Pro Plan - $19/month' : 'Free Plan'}
                            </p>
                          </div>
                          
                          {!user.isPro ? (
                            <div>
                              <Button onClick={() => setLocation('/subscribe')}>
                                Upgrade to Pro
                              </Button>
                              <p className="text-sm text-slate-600 mt-2">
                                Get unlimited invoices and advanced features
                              </p>
                            </div>
                          ) : (
                            <div>
                              <Button 
                                variant="destructive" 
                                onClick={() => cancelSubscriptionMutation.mutate()}
                                disabled={cancelSubscriptionMutation.isPending}
                              >
                                {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                              </Button>
                              <p className="text-sm text-slate-600 mt-2">
                                Your subscription will remain active until the end of the current billing period
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
          
          {/* Setup Wizard Modal */}
          {showSetupWizard && (
            <EmailSetupWizard
              isOpen={showSetupWizard}
              onClose={() => setShowSetupWizard(false)}
            />
          )}

          {/* Template Manager Modal */}
          {showTemplateManager && (
            <EmailTemplateManager
              isOpen={showTemplateManager}
              onClose={() => setShowTemplateManager(false)}
            />
          )}

          {/* Template Editor Modal */}
          {showTemplateEditor && (
            <EmailTemplateEditor
              isOpen={showTemplateEditor}
              onClose={() => setShowTemplateEditor(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
}