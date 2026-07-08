import { server } from './src/mocks/index.ts';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Start server before all tests
beforeAll(() => {
	server.listen();
});

// Close server after all tests
afterAll(() => {
	server.close();
});

// Reset handlers after each test for test isolation
afterEach(() => {
	server.resetHandlers();
});

server.events.on("*", (e) => {
	console.log(e.type,{req:e.request.url});
});
