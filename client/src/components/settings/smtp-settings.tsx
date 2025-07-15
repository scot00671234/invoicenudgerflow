import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Server, Settings, Shield, Clock, Calendar } from 'lucide-react';

export function SmtpSettings() {
  const [formData, setFormData] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFromName: '',
    nudgeEnabled: true,
    firstNudgeDelay: 1,
    nudgeInterval: 3,
    businessHoursOnly: true,
    businessStartHour: 9,
    businessEndHour: 17,
    weekdaysOnly: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    onSuccess: (data) => {
      setFormData({
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
        description: "Your email automation settings have been updated successfully.",
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

  const testSmtpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/test-smtp', formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMTP Test Successful",
        description: "Your SMTP configuration is working correctly.",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  const handleTestSmtp = () => {
    testSmtpMutation.mutate();
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SMTP Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              SMTP Configuration
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure your email server settings to send automated nudges
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={formData.smtpHost}
                  onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input
                  id="smtpUser"
                  value={formData.smtpUser}
                  onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPass">SMTP Password</Label>
                <Input
                  id="smtpPass"
                  type="password"
                  value={formData.smtpPass}
                  onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                  placeholder="your-app-password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="smtpFromName">From Name</Label>
              <Input
                id="smtpFromName"
                value={formData.smtpFromName}
                onChange={(e) => setFormData({ ...formData, smtpFromName: e.target.value })}
                placeholder="Your Business Name"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestSmtp}
                disabled={testSmtpMutation.isPending}
              >
                <Mail className="h-4 w-4 mr-2" />
                {testSmtpMutation.isPending ? 'Testing...' : 'Test SMTP'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Nudge Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Nudge Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure when and how often to send payment reminders
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="nudgeEnabled">Enable Nudges</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send payment reminders for overdue invoices
                </p>
              </div>
              <Switch
                id="nudgeEnabled"
                checked={formData.nudgeEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, nudgeEnabled: checked })}
              />
            </div>

            {formData.nudgeEnabled && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstNudgeDelay">First Nudge Delay (days)</Label>
                    <Select
                      value={formData.firstNudgeDelay.toString()}
                      onValueChange={(value) => setFormData({ ...formData, firstNudgeDelay: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Same day</SelectItem>
                        <SelectItem value="1">1 day after due date</SelectItem>
                        <SelectItem value="2">2 days after due date</SelectItem>
                        <SelectItem value="3">3 days after due date</SelectItem>
                        <SelectItem value="7">1 week after due date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nudgeInterval">Nudge Interval (days)</Label>
                    <Select
                      value={formData.nudgeInterval.toString()}
                      onValueChange={(value) => setFormData({ ...formData, nudgeInterval: parseInt(value) })}
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
                      checked={formData.businessHoursOnly}
                      onCheckedChange={(checked) => setFormData({ ...formData, businessHoursOnly: checked })}
                    />
                  </div>

                  {formData.businessHoursOnly && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessStartHour">Start Hour</Label>
                        <Select
                          value={formData.businessStartHour.toString()}
                          onValueChange={(value) => setFormData({ ...formData, businessStartHour: parseInt(value) })}
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
                          value={formData.businessEndHour.toString()}
                          onValueChange={(value) => setFormData({ ...formData, businessEndHour: parseInt(value) })}
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
                      checked={formData.weekdaysOnly}
                      onCheckedChange={(checked) => setFormData({ ...formData, weekdaysOnly: checked })}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full"
          disabled={updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
}