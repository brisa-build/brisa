import { type Signal } from "brisa";

export default function generatePercentage(percentage: Signal<number>) {
  return (
    <span>
      {percentage.value > 0 ? `+${percentage.value}` : percentage.value}%
    </span>
  );
}
