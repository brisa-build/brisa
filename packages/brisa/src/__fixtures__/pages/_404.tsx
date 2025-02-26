// @ts-nocheck
export const Head = () => {
  return <title id="title">Page not found</title>;
};

export default async function _404({}, { i18n }) {
  return (
    <h1>
      {/* @ts-ignore */}
      Page not found 404 {i18n.locale}
      <web-component />
    </h1>
  );
}
