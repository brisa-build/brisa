export default function navigate(url: string): never {
  if (typeof window !== "undefined") {
    location.assign(url);
    const errorFn = (e: ErrorEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.removeEventListener("error", errorFn);
    };
    window.addEventListener("error", errorFn);
  }
  const navigationThrowable = new Error(url);
  navigationThrowable.name = "navigate";
  throw navigationThrowable;
}
