import type { Pokemon } from '@/data';

export default function Attacks({
  attacks,
}: {
  attacks: Pokemon['attacks'];
}) {
  return (
    <div>
      <h4 class="">Attacks</h4>
      <ul>
        {attacks?.map((attack) => (
          <li>
            <span class="">{attack.name}</span> - {attack.power}
          </li>
        ))}
      </ul>
    </div>
  );
}
