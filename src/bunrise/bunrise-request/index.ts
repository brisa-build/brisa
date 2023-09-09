import { MatchedRoute } from "bun";
import { describe } from "bun:test";

export default class BunriseRequest extends Request {
  constructor(request: Request, route?: MatchedRoute) {
    super(request);
    this.route = route;
  }

  route?: MatchedRoute;
  context = new Map<string, any>();
}
