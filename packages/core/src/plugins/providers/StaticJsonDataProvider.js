import { DataProvider } from '../DataProvider.js';

export class StaticJsonDataProvider extends DataProvider {
  constructor() {
    super({ id: 'static-json' });
  }

  supports(source) {
    return !!source.data && typeof source.data === 'object';
  }

  async load(source) {
    return source.data;
  }
}
