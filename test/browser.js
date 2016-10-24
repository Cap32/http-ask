
import specs from './specs';

const host = window.__karma__.config.args[0];

describe('http-ask', () => specs(host));
