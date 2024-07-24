import type { Signal } from '@/types';

export default function generatePercentage(percentage: Signal<number>) {
  return <span>{percentage.value > 0 ? `+${percentage.value}` : percentage.value}%</span>;
}
