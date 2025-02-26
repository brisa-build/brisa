import { navigate, notFound, type RequestContext } from 'brisa';

export default async function middleware(request: RequestContext) {
  const url = new URL(request.finalURL);

  if (url.searchParams.get('throws-error')) {
    throw new Error('Some internal error');
  }

  if (url.searchParams.get('throws-not-found')) {
    notFound();
  }

  if (url.searchParams.has('navigate')) {
    const navigateTo = url.searchParams.get('navigate') as string;
    navigate(navigateTo);
  }

  if (url.searchParams.get('redirect-to-about')) {
    return new Response('', {
      status: 301,
      headers: {
        Location: '/about',
      },
    });
  }
}
