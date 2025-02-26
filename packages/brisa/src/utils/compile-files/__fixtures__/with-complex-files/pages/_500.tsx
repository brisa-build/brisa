export const Head = () => {
  return <title id="title">Some internal error</title>;
};

export default async function _500() {
  return (
    <h1>
      {/* @ts-ignore */}
      Some internal error <web-component />
    </h1>
  );
}
