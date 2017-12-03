
import { createServer, closeServer } from './utils/server';
import specs from './specs';
import { name } from '../package.json';

createServer((host) => {
	describe(name, () => {
		specs(host);
		after(closeServer);
	});

	run();
});
