import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { NudgeScheduler } from '@/components/scheduling/nudge-scheduler';

export function UpcomingNudges() {
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const { data: upcomingNudges = [] } = useQuery({
    queryKey: ['/api/dashboard/upcoming-nudges'],
  });

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

  const getNudgeColor = (nudgeNumber: number) => {
    if (nudgeNumber === 1) return 'text-primary';
    if (nudgeNumber === 2) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Upcoming Nudges
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80"
            onClick={() => setIsSchedulerOpen(true)}
          >
            Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4">
          {upcomingNudges.map((nudge: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {nudge.invoice.clientName}
                </p>
                <p className="text-xs text-slate-500">
                  {nudge.invoice.invoiceId} • ${nudge.invoice.amount}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">
                  {formatDate(nudge.nextNudgeDate)}
                </p>
                <Badge variant="outline" className={getNudgeColor(nudge.nudgeNumber)}>
                  {nudge.nudgeNumber === 1 ? '1st' : nudge.nudgeNumber === 2 ? '2nd' : '3rd'} nudge
                </Badge>
              </div>
            </div>
          ))}
          {upcomingNudges.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">No upcoming nudges scheduled</p>
            </div>
          )}
        </div>
      </CardContent>
      <NudgeScheduler isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
    </Card>
  );
}
