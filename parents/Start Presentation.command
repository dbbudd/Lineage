#!/bin/zsh
cd -- "${0:A:h}"
python3 - <<'PY'
from pathlib import Path
from urllib.request import urlopen
import json,os,socket,subprocess,sys,webbrowser
root=Path.cwd();port=None
for candidate in range(4314,4330):
    try:
        data=json.load(urlopen(f'http://127.0.0.1:{candidate}/__deck_health',timeout=.25))
        if data.get('deck')=='parent-coffee-2026-11-18' and Path(data.get('root',''))==root:
            if not os.environ.get('FOLHK_DECK_NO_OPEN'):webbrowser.open(f'http://127.0.0.1:{candidate}/')
            sys.exit(0)
    except Exception:pass
    probe=socket.socket()
    try:
        probe.bind(('127.0.0.1',candidate));port=candidate;break
    except OSError:pass
    finally:probe.close()
if port is None:
    print('No free presentation port. Close an earlier presentation server and try again.');sys.exit(1)
command=[sys.executable,str(root/'serve.py'),'--port',str(port)]
if not os.environ.get('FOLHK_DECK_NO_OPEN'):command.append('--open')
process=subprocess.Popen(command,cwd=root,start_new_session=True,stdout=(root/'presentation-server.log').open('a'),stderr=subprocess.STDOUT)
(root/'.presentation-server.json').write_text(json.dumps({'pid':process.pid,'port':port}))
print(f'Opening http://127.0.0.1:{port}/ — press F for full screen, then use the arrow keys.')
PY
