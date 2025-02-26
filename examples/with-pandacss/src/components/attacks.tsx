import type { Pokemon } from '@/data';

export default function Attacks({ attacks }: { attacks: Pokemon['attacks'] }) {
  return (
    <div>
      <h4 className="">Attacks</h4>
      <ul>
        {attacks?.map((attack) => (
          <li>
            <span className="">{attack.name}</span> - {attack.power}
          </li>
        ))}
      </ul>
    </div>
  );
}
