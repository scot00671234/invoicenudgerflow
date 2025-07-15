import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total: number;
    paid: number;
    overdue: number;
    totalValue: string;
    paidValue: string;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (value: string) => {
    return `$${parseFloat(value).toLocaleString()}`;
  };

  const getPaidRate = () => {
    if (stats.total === 0) return '0%';
    return `${((stats.paid / stats.total) * 100).toFixed(1)}%`;
  };

  const cards = [
    {
      title: 'Total Invoices',
      value: stats.total.toString(),
      icon: FileText,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      subtitle: `+${stats.total - stats.paid - stats.overdue} this week`,
      subtitleColor: 'text-slate-500',
    },
    {
      title: 'Paid Invoices',
      value: stats.paid.toString(),
      icon: CheckCircle,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: `${getPaidRate()} paid rate`,
      subtitleColor: 'text-success',
    },
    {
      title: 'Overdue',
      value: stats.overdue.toString(),
      icon: Clock,
      iconColor: 'text-warning',
      bgColor: 'bg-warning/10',
      subtitle: 'Nudges active',
      subtitleColor: 'text-warning',
    },
    {
      title: 'Total Value',
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: `${formatCurrency(stats.paidValue)} collected`,
      subtitleColor: 'text-success',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-xs ${card.subtitleColor}`}>
                {card.subtitle}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
