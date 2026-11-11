#!/usr/bin/env python3
"""Run UI and service-worker regression checks in Chromium without dependencies."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
from queue import Queue, Empty
import shutil
import signal
import subprocess
import tempfile
import threading
import sys

ROOT = Path(__file__).resolve().parents[1]
RESULTS = Queue()


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/anesthesia/index.html' and getattr(self.server, 'simulate_failure', False):
            self.send_response(503)
            self.end_headers()
            self.wfile.write(b'Simulated server failure')
            return
        super().do_GET()

    def do_POST(self):
        if self.path == '/__fault':
            self.server.simulate_failure = self.rfile.read(int(self.headers.get('Content-Length', 0))) == b'on'
            self.send_response(204)
            self.end_headers()
            return
        if self.path != '/__results':
            return self.send_error(404)
        payload = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        RESULTS.put(json.loads(payload))
        self.send_response(204)
        self.end_headers()

    def translate_path(self, path):
        if path.startswith('/anesthesia/'):
            path = '/docs/' + path[len('/anesthesia/'):]
        return super().translate_path(path)

    def send_error(self, code, message=None, explain=None):
        if code == 404 and self.path.startswith('/anesthesia/'):
            content = (ROOT / 'docs/404.html').read_bytes()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        else:
            super().send_error(code, message, explain)

    def log_message(self, *_):
        pass


def main():
    browser = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    if not browser:
        raise SystemExit('Install Chromium or Google Chrome to run browser checks.')
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with tempfile.TemporaryDirectory(prefix='anesthesia-browser-', ignore_cleanup_errors=True) as profile, tempfile.TemporaryFile(mode='w+') as browser_log:
            browser_process = subprocess.Popen([
                browser, '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
                '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
                '--no-proxy-server', '--remote-debugging-port=0', f'--user-data-dir={profile}',
                f'http://127.0.0.1:{server.server_port}/tests/browser.html',
            ], text=True, stdout=browser_log, stderr=browser_log, start_new_session=True)
            try:
                result = RESULTS.get(timeout=60)
                print(json.dumps(result, indent=2))
                if not result.get('passed'):
                    browser_log.seek(0)
                    print(browser_log.read(), file=sys.stderr)
                    return 1
            except Empty:
                browser_log.seek(0)
                print('Browser checks timed out.\n' + browser_log.read(), file=sys.stderr)
                return 1
            finally:
                # Stop this browser's children too, so they cannot keep writing
                # to the temporary profile while it is being removed.
                try:
                    os.killpg(browser_process.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
                try:
                    browser_process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    os.killpg(browser_process.pid, signal.SIGKILL)
                    browser_process.wait()
    finally:
        server.shutdown()
        server.server_close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
