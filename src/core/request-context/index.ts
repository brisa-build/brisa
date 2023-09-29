import { MatchedRoute, ServerWebSocket } from "bun";
import { I18nFromRequest } from "../../types";

export default class RequestContext extends Request {
  constructor(request: Request, route?: MatchedRoute) {
    super(request);
    this.route = route;
    this.context = new Map<string, any>();
    this.ws = globalThis.ws;
  }

  route?: MatchedRoute;
  context: Map<string, any>;
  i18n?: I18nFromRequest;
  ws?: ServerWebSocket<unknown>;
}
