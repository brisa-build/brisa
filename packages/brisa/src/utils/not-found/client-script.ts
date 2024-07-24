import type { RequestContext } from '@/types';

export default function get404ClientScript(request?: RequestContext) {
  const action = request?.renderInitiator === 'SERVER_ACTION' ? 'assign' : 'replace';
  return `<script>(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.${action}(u.toString())})()</script>`;
}
