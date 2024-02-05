export default function navigate(url: string) {
  const navigationThrowable = new Error(url);
  navigationThrowable.name = "navigate";
  throw navigationThrowable;
}
