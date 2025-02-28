import type { Animal, AnimalInfo } from '@/types';
import type { WebContext } from 'brisa';

export default async function ChooseAnimal({}, { state }: WebContext) {
  const res = await fetch('/api/animal'); // error handled via ChooseAnimal.error
  const animals = await res.json();
  const currentAnimal = state<AnimalInfo>();

  async function onChange(e: Event) {
    const id = (e.target as HTMLSelectElement).value;
    const curr = await fetch(`/api/animal/${id}`).then((r) => r.json());
    currentAnimal.value = curr;
  }

  return (
    <div>
      <select onChange={onChange}>
        {animals.map((animal: Animal) => (
          <option value={animal.id}>{animal.name}</option>
        ))}
      </select>
      {currentAnimal.value && (
        <div>
          <h2>{currentAnimal.value.name}</h2>
          {currentAnimal.value.hasTail && <p>Has Tail</p>}
          <p>Abilities: {currentAnimal.value.abilities?.join(', ')}</p>
          <img src={currentAnimal.value.image} alt={currentAnimal.value.name} />
        </div>
      )}
    </div>
  );
}

// "Suspense" and "Error" in Brisa are Component states defined once
ChooseAnimal.suspense = () => (
  <div>Loading Animals from src/api/animal/index.tsx...</div>
);
ChooseAnimal.error = () => (
  <div style={{ color: 'red' }}>It was an error with the API</div>
);
