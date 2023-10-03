import { MatchedRoute, ServerWebSocket, SocketAddress } from "bun";
import { I18nFromRequest } from "../../types";

export default class RequestContext extends Request {
  constructor(request: Request, route?: MatchedRoute) {
    super(request);
    this.route = route;
    this.context = new Map<string, any>();
    this.ws = globalThis.ws;
    this.i18n = {
      defaultLocale: '',
      locales: [],
      locale: '',
      t: () => '',
    }
    this.getIP = () => null;
  }

  route?: MatchedRoute;
  context: Map<string, any>;
  i18n: I18nFromRequest;
  getIP: () => SocketAddress | null;
  ws?: ServerWebSocket<unknown>;
}
