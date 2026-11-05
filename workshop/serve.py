#!/usr/bin/env python3
"""Serve this self-contained static deck on loopback, including byte-range media."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
import re
import threading
import webbrowser

ROOT=Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path=='/__deck_health':
            payload=json.dumps({'deck':'folhk-vibe-coding-2026-11-14','root':str(ROOT)}).encode()
            self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(payload)));self.end_headers();self.wfile.write(payload);return
        return super().do_GET()

    def send_head(self):
        # Safari uses range requests to start and seek large MP4s.
        file=Path(self.translate_path(self.path));range_header=self.headers.get('Range')
        if range_header and file.is_file():
            size=file.stat().st_size;match=re.fullmatch(r'bytes=(\d*)-(\d*)',range_header.strip())
            if match:
                left,right=match.groups()
                start=int(left) if left else max(0,size-int(right))
                end=min(int(right),size-1) if right and left else size-1
                if start>=size or start>end:
                    self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.end_headers();return None
                stream=file.open('rb');stream.seek(start);self._range_length=end-start+1
                self.send_response(206);self.send_header('Content-Type',self.guess_type(str(file)));self.send_header('Content-Range',f'bytes {start}-{end}/{size}');self.send_header('Content-Length',str(self._range_length));self.send_header('Accept-Ranges','bytes');self.end_headers();return stream
        self._range_length=None
        return super().send_head()

    def copyfile(self,source,output):
        try:
            remaining=getattr(self,'_range_length',None)
            if remaining is None:return super().copyfile(source,output)
            while remaining:
                chunk=source.read(min(256*1024,remaining))
                if not chunk:break
                output.write(chunk);remaining-=len(chunk)
        except (BrokenPipeError,ConnectionResetError):pass

    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()

    def log_message(self,format,*args):pass


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=4314);p.add_argument('--open',action='store_true');a=p.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',a.port),partial(Handler,directory=str(ROOT)))
    print(f'Presentation ready: http://127.0.0.1:{a.port}/',flush=True)
    if a.open:threading.Timer(.3,lambda:webbrowser.open(f'http://127.0.0.1:{a.port}/')).start()
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
