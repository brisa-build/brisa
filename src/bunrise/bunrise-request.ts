import { MatchedRoute } from "bun";

export default class BunriseRequest extends Request {
  constructor(request: Request, route?: MatchedRoute) {
    super(request);
    this.route = route;
  }

  route?: MatchedRoute;
  context = new Map<string, any>();
}
