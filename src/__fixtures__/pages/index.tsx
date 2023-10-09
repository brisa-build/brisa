export default async function Home() {
  return <div>Hello world</div>;
}

Home.suspense = () => {
  return <div>Loading...</div>;
};
