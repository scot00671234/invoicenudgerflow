import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Mail, Settings, AlertCircle, CheckCircle } from 'lucide-react';

interface NudgeSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NudgeScheduler({ isOpen, onClose }: NudgeSchedulerProps) {
  const [activeTab, setActiveTab] = useState('schedule');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['/api/nudge-settings'],
    enabled: isOpen,
  });

  const { data: upcomingNudges = [] } = useQuery({
    queryKey: ['/api/dashboard/upcoming-nudges'],
    enabled: isOpen,
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['/api/email-templates'],
    enabled: isOpen,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/nudge-settings', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your nudge settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/nudge-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const [nudgeSettings, setNudgeSettings] = useState({
    enabled: settings?.enabled ?? true,
    firstNudgeDelay: settings?.firstNudgeDelay ?? 1, // days after due date
    nudgeInterval: settings?.nudgeInterval ?? 3, // days between nudges
    maxNudges: settings?.maxNudges ?? 3,
    businessHoursOnly: settings?.businessHoursOnly ?? true,
    businessStartHour: settings?.businessStartHour ?? 9,
    businessEndHour: settings?.businessEndHour ?? 17,
    weekdaysOnly: settings?.weekdaysOnly ?? true,
    fromEmail: settings?.fromEmail ?? '',
    customMessage: settings?.customMessage ?? '',
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(nudgeSettings);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUrgencyColor = (daysOverdue: number) => {
    if (daysOverdue >= 14) return 'bg-red-500';
    if (daysOverdue >= 7) return 'bg-orange-500';
    if (daysOverdue >= 3) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getUrgencyText = (daysOverdue: number) => {
    if (daysOverdue >= 14) return 'Critical';
    if (daysOverdue >= 7) return 'High';
    if (daysOverdue >= 3) return 'Medium';
    return 'Low';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Nudge Scheduler
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Upcoming Nudges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingNudges.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No upcoming nudges scheduled</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Nudges will appear here when invoices become overdue
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingNudges.map((nudge: any, index: number) => {
                      const daysOverdue = Math.ceil((new Date().getTime() - new Date(nudge.invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getUrgencyColor(daysOverdue)}`} />
                            <div>
                              <p className="font-medium">{nudge.invoice.clientName}</p>
                              <p className="text-sm text-gray-500">
                                {nudge.invoice.invoiceId} • ${nudge.invoice.amount} • {daysOverdue} days overdue
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={getUrgencyColor(daysOverdue).replace('bg-', 'border-').replace('500', '200')}>
                              {getUrgencyText(daysOverdue)}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatDate(nudge.nextNudgeDate)}</p>
                              <p className="text-xs text-gray-500">
                                {nudge.nudgeNumber === 1 ? '1st' : nudge.nudgeNumber === 2 ? '2nd' : `${nudge.nudgeNumber}rd`} nudge
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Nudge Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enabled" className="text-sm font-medium">
                      Enable Automatic Nudges
                    </Label>
                    <p className="text-sm text-gray-500">
                      Automatically send payment reminders for overdue invoices
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={nudgeSettings.enabled}
                    onCheckedChange={(checked) => setNudgeSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstNudgeDelay">First Nudge Delay (days)</Label>
                    <Input
                      id="firstNudgeDelay"
                      type="number"
                      min="0"
                      max="30"
                      value={nudgeSettings.firstNudgeDelay}
                      onChange={(e) => setNudgeSettings(prev => ({ ...prev, firstNudgeDelay: parseInt(e.target.value) }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Days after due date to send first reminder</p>
                  </div>

                  <div>
                    <Label htmlFor="nudgeInterval">Nudge Interval (days)</Label>
                    <Input
                      id="nudgeInterval"
                      type="number"
                      min="1"
                      max="14"
                      value={nudgeSettings.nudgeInterval}
                      onChange={(e) => setNudgeSettings(prev => ({ ...prev, nudgeInterval: parseInt(e.target.value) }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Days between follow-up reminders</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fromEmail">Send From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={nudgeSettings.fromEmail}
                    onChange={(e) => setNudgeSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="your-business@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Clients will see this as the sender. Use your business email for better deliverability.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="businessHoursOnly">Business Hours Only</Label>
                    <p className="text-sm text-gray-500">
                      Send nudges only during business hours
                    </p>
                  </div>
                  <Switch
                    id="businessHoursOnly"
                    checked={nudgeSettings.businessHoursOnly}
                    onCheckedChange={(checked) => setNudgeSettings(prev => ({ ...prev, businessHoursOnly: checked }))}
                  />
                </div>

                {nudgeSettings.businessHoursOnly && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessStartHour">Start Hour</Label>
                      <Select
                        value={nudgeSettings.businessStartHour.toString()}
                        onValueChange={(value) => setNudgeSettings(prev => ({ ...prev, businessStartHour: parseInt(value) }))}
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
                        value={nudgeSettings.businessEndHour.toString()}
                        onValueChange={(value) => setNudgeSettings(prev => ({ ...prev, businessEndHour: parseInt(value) }))}
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
                    <p className="text-sm text-gray-500">
                      Send nudges only on Monday through Friday
                    </p>
                  </div>
                  <Switch
                    id="weekdaysOnly"
                    checked={nudgeSettings.weekdaysOnly}
                    onCheckedChange={(checked) => setNudgeSettings(prev => ({ ...prev, weekdaysOnly: checked }))}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Mail className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Email template customization</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Coming soon - customize your nudge email templates
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}