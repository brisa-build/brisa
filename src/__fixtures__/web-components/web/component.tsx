export default function WebComponent() {
  console.log(process.env.BRISA_PUBLIC_TEST);
  // @ts-ignore
  return <native-some-example />;
}
