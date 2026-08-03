'use client';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

interface CapacityTrendChartProps {
  period?: TimePeriod;
  className?: string;
}

/**
 * Placeholder chart component. Capacity analytics UIs import TimePeriod from here.
 * Full chart implementation is out of scope for the senior assignment.
 */
export default function CapacityTrendChart(_props: CapacityTrendChartProps) {
  return null;
}
