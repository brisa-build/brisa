export default function Pokemon() {
  return <div>pokemon</div>;
}

export function prerender() {
  return [{ slug: 'charizard' }, { slug: 'pikachu' }];
}
