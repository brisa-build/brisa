export const Head = () => {
  return <title id="title">Page not found</title>;
};

export default async function _404() {
  return (
    <h1>
      {/* @ts-ignore */}
      Page not found 404 <web-component />
    </h1>
  );
}
