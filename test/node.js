
import { createServer, closeServer } from './utils/server';
import specs from './specs';

createServer((host) => {
	describe('http-ask', () => {
		specs(host);
		after(closeServer);
	});

	run();
});
