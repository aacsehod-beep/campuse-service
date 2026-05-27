'use client';

interface Props {
  orderId: string;
  isProvider: boolean;
  orderStatus: string;
  providerName: string;
}

export default function LiveTrackingPanel({ providerName }: Props) {
  return (
    <div className="glass-card rounded-2xl p-4 text-sm text-muted-foreground text-center">
      Live tracking coming soon — <span className="text-foreground font-medium">{providerName}</span> is on the way.
    </div>
  );
}
