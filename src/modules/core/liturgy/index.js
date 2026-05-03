import BaseModule from "../../BaseModule";
import es from "./lang/es.json";
import pt from "./lang/pt.json";
import manifest from "./manifest.json";

export default class extends BaseModule {
  constructor() {
    manifest.translations = { pt, es };
    super(manifest);
  }
}
