import { MatchedRoute } from "bun";
import { I18nFromRequest } from "../../types";

export default class BunriseRequest extends Request {
  constructor(request: Request, route?: MatchedRoute) {
    super(request);
    this.route = route;
    this.url = request.url;
    this.context = new Map<string, any>();
  }

  url: string;
  route?: MatchedRoute;
  context: Map<string, any>;
  i18n?: I18nFromRequest;
}
