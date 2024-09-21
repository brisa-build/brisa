export default function HeadingsMapPopOver({
  children,
}: {
  children: JSX.Element;
}) {
  return (
    <>
      <button class="headings-map-button" popoverTarget="headings-map-popover">
        {children}
      </button>
      <headings-map
        id="headings-map-popover"
        skipSSR
        popover="auto"
        popoverTarget="headings-map-popover"
        popoverTargetAction="hide"
      />
    </>
  );
}
