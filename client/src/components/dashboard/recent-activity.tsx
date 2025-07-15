import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Send, Plus } from 'lucide-react';

export function RecentActivity() {
  // This would normally come from an API
  const activities = [
    {
      type: 'payment',
      message: 'Invoice #1234 marked as paid',
      detail: 'Acme Corp • 2 hours ago',
      icon: CheckCircle,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      type: 'nudge',
      message: 'Nudge sent to TechStart Inc',
      detail: 'Invoice #1235 • 4 hours ago',
      icon: Send,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      type: 'created',
      message: 'New invoice added',
      detail: 'Design Co • Yesterday',
      icon: Plus,
      iconColor: 'text-slate-600',
      bgColor: 'bg-slate-100',
    },
  ];

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-8 h-8 ${activity.bgColor} rounded-full flex items-center justify-center`}>
                <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                <p className="text-xs text-slate-500">{activity.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
