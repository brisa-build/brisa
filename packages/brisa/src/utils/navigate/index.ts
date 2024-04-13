export default function navigate(url: string): never {
  // This code is removed by the bundler when basePath is not used
  if (__BASE_PATH__) {
    url = URL.canParse(url) ? url : (__BASE_PATH__ ?? "") + url;
  }

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
