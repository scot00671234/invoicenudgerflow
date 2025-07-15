import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Server, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  ArrowRight
} from 'lucide-react';

export function EmailSetupStatus() {
  const [, setLocation] = useLocation();
  
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });

  const { data: templates } = useQuery({
    queryKey: ['/api/email-templates'],
  });

  if (!settings) return null;

  const hasSmtpConfig = !!(settings.user.smtpHost && settings.user.smtpUser && settings.user.smtpPass);
  const hasTemplates = templates && templates.length > 0;
  const nudgeEnabled = settings.user.nudgeEnabled ?? true;
  
  const setupSteps = [
    {
      title: "Email Server",
      description: "SMTP configuration",
      completed: hasSmtpConfig,
      icon: <Server className="h-4 w-4" />
    },
    {
      title: "Templates",
      description: "Email templates",
      completed: hasTemplates,
      icon: <FileText className="h-4 w-4" />
    },
    {
      title: "Automation",
      description: "Nudge settings",
      completed: nudgeEnabled,
      icon: <Settings className="h-4 w-4" />
    }
  ];

  const completedSteps = setupSteps.filter(step => step.completed).length;
  const progress = (completedSteps / setupSteps.length) * 100;
  const isFullySetup = completedSteps === setupSteps.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Automation Setup
          {isFullySetup ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertCircle className="h-3 w-3 mr-1" />
              {completedSteps}/{setupSteps.length} Complete
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isFullySetup 
            ? "Your email automation system is fully configured and ready to send invoice reminders."
            : "Complete the setup to start sending automated invoice reminders."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Setup Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {setupSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                step.completed 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              {step.completed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                step.icon
              )}
              <div>
                <div className="font-medium">{step.title}</div>
                <div className="text-xs opacity-75">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {!isFullySetup && (
          <div className="pt-2 border-t">
            <Button
              onClick={() => setLocation('/settings')}
              className="w-full"
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Continue Setup
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {isFullySetup && (
          <div className="pt-2 border-t">
            <div className="flex gap-2">
              <Button
                onClick={() => setLocation('/settings')}
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={() => setLocation('/invoices')}
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}