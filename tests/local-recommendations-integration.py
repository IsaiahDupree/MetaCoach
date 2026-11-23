"""Exercise recommendation ownership on disposable loopback PostgreSQL/PostgREST.

The schema below is inferred from the checked-in application queries: the
repository does not include these tables in its sole migration. It does not
establish the hosted schema, grants or RLS. No hosted services are called.
"""
import os, secrets, shutil, socket, subprocess, tempfile, threading, time, urllib.error, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PG = Path('/opt/homebrew/opt/postgresql@16/bin')
REST = Path('/tmp/strategythread-postgrest-v16.6/postgrest')

def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def run(args, **kwargs):
    try:
        return subprocess.run(args, check=True, capture_output=True, text=True, timeout=45, **kwargs)
    except subprocess.CalledProcessError as e:
        print(e.stdout or '', e.stderr or '')
        raise

with tempfile.TemporaryDirectory(prefix='matrix-rec-', dir='/tmp') as tmp:
    root = Path(tmp); pgdata = root / 'pg'; sock = root / 'sock'; sock.mkdir(mode=0o700)
    pgport, restport = free_port(), free_port()
    started = False; rest = None; proxy = None; thread = None
    try:
        run([str(PG/'initdb'), '-D', str(pgdata), '-U', 'matrix_test_owner', '-A', 'trust', '--no-locale', '--encoding=UTF8'])
        run([str(PG/'pg_ctl'), '-D', str(pgdata), '-l', str(root/'pg.log'), '-o', f'-h 127.0.0.1 -p {pgport} -k {sock}', '-w', 'start'])
        started = True
        sql = """
        CREATE ROLE matrix_test_reader NOLOGIN; GRANT matrix_test_reader TO matrix_test_owner;
        CREATE TABLE meta_accounts (id text PRIMARY KEY, user_id text NOT NULL, account_name text,
          account_currency text, account_timezone text, access_token text, token_expires_at timestamptz,
          is_active boolean NOT NULL DEFAULT true);
        CREATE TABLE meta_ad_sets (id text PRIMARY KEY, meta_account_id text NOT NULL REFERENCES meta_accounts(id));
        CREATE TABLE meta_ads (id text PRIMARY KEY, meta_ad_set_id text NOT NULL REFERENCES meta_ad_sets(id));
        CREATE TABLE meta_ad_performance (meta_ad_id text NOT NULL REFERENCES meta_ads(id), date date NOT NULL,
          impressions integer, clicks integer, spend numeric, actions integer, action_value numeric,
          ctr numeric, cpc numeric, cpa numeric, roas numeric);
        CREATE TABLE meta_coach_recommendations (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          meta_account_id text REFERENCES meta_accounts(id), recommendation_type text, title text,
          description text, confidence_score numeric, estimated_impact numeric, estimated_effort text,
          implementation_instructions text, is_implemented boolean);
        CREATE TABLE campaigns (id text PRIMARY KEY, meta_account_id text NOT NULL REFERENCES meta_accounts(id),
          campaign_name text, campaign_status text, campaign_objective text);
        INSERT INTO meta_accounts (id,user_id,account_name,account_currency) VALUES
          ('account-a','user-a','Account A','USD'),('account-b','user-b','Account B','EUR'),('account-c','user-a','Account C','USD'),('account-d','user-a','Account D','USD');
        UPDATE meta_accounts SET access_token='local-original' WHERE id='account-a';
        INSERT INTO campaigns VALUES ('campaign-a','account-a','A campaign','ACTIVE','SALES'),
          ('campaign-b','account-b','B campaign','PAUSED','SALES');
        INSERT INTO meta_ad_sets VALUES ('set-a','account-a'),('set-b','account-b'),('set-d','account-d');
        INSERT INTO meta_ads VALUES ('ad-a','set-a'),('ad-b','set-b'),('ad-d','set-d');
        INSERT INTO meta_ad_performance VALUES
          ('ad-a', CURRENT_DATE, 1000,20,100,2,300,2,5,50,3),
          ('ad-b', CURRENT_DATE, 1000,2,900,1,90,.2,450,900,.1);
        INSERT INTO meta_ad_performance SELECT 'ad-d', CURRENT_DATE, 1, 1, 1, 1, 1, 1, 1, 1, 1 FROM generate_series(1,1001);
        GRANT USAGE ON SCHEMA public TO matrix_test_reader;
        GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA public TO matrix_test_reader;
        GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO matrix_test_reader;
        """
        psql = [str(PG/'psql'), '-h', '127.0.0.1', '-p', str(pgport), '-U', 'matrix_test_owner', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1']
        run(psql + ['-c', sql])
        env = {'PATH': os.environ['PATH'], 'PGRST_DB_URI': f'postgres://matrix_test_owner@127.0.0.1:{pgport}/postgres',
               'PGRST_DB_SCHEMAS': 'public', 'PGRST_DB_ANON_ROLE': 'matrix_test_reader',
               'PGRST_SERVER_HOST': '127.0.0.1', 'PGRST_SERVER_PORT': str(restport)}
        rest = subprocess.Popen([str(REST)], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(150):
            if rest.poll() is not None: raise RuntimeError('PostgREST exited')
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{restport}/', timeout=.3): break
            except (OSError, urllib.error.URLError): time.sleep(.1)
        else: raise RuntimeError('PostgREST did not start')

        class Proxy(BaseHTTPRequestHandler):
            def do_GET(self): self.forward()
            def do_POST(self): self.forward()
            def do_PATCH(self): self.forward()
            def forward(self):
                if not self.path.startswith('/rest/v1/'): self.send_error(404); return
                data = self.rfile.read(int(self.headers.get('Content-Length', '0'))) or None
                headers = {k:v for k,v in self.headers.items() if k.lower() not in {'host','authorization','apikey','content-length'}}
                q = urllib.request.Request(f'http://127.0.0.1:{restport}' + self.path[len('/rest/v1'):], method=self.command, data=data, headers=headers)
                try: response = urllib.request.urlopen(q, timeout=4)
                except urllib.error.HTTPError as error: response = error
                with response:
                    body=response.read(); self.send_response(response.status)
                    for k,v in response.headers.items():
                        if k.lower() not in {'connection','transfer-encoding','content-length'}: self.send_header(k,v)
                    self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
            def log_message(self, *args): pass

        proxy = ThreadingHTTPServer(('127.0.0.1', 0), Proxy)
        thread = threading.Thread(target=proxy.serve_forever, daemon=True); thread.start()
        env = {'PATH': os.environ['PATH'], 'HOME': tmp, 'NODE_ENV': 'test',
               'NEXT_PUBLIC_SUPABASE_URL': f'http://127.0.0.1:{proxy.server_port}',
               'SUPABASE_SERVICE_ROLE_KEY': 'local-only', 'SUPABASE_JWT_SECRET': secrets.token_hex(32)}
        command = ['/usr/bin/sandbox-exec', '-p', '(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))',
                   shutil.which('node'), '--import', 'tsx', 'tests/local-recommendations.mts']
        result = run(command, cwd=ROOT, env=env)
        print(result.stdout.strip())
        counts = run(psql + ['-At', '-c', "SELECT meta_account_id || ':' || count(*) FROM meta_coach_recommendations GROUP BY meta_account_id ORDER BY meta_account_id"]).stdout.splitlines()
        assert len(counts) == 2 and counts[0].startswith('account-a:') and counts[1].startswith('account-b:'), counts
        print('PASS: generated recommendations stored for both distinct local accounts')
        dashboard = command[:-1] + ['tests/local-dashboard.mts']
        result = run(dashboard, cwd=ROOT, env=env)
        print(result.stdout.strip())
        oauth = command[:-1] + ['tests/local-oauth.mts']
        result = run(oauth, cwd=ROOT, env={**env, 'PUBLIC_BASE_URL': 'http://localhost:4545', 'META_APP_ID': 'local-test-app'})
        print(result.stdout.strip())
        run(psql + ['-c', 'REVOKE SELECT ON meta_ad_performance FROM matrix_test_reader'])
        result = run(command, cwd=ROOT, env={**env, 'EXPECT_STORAGE_ERROR': '1'})
        print(result.stdout.strip())
        run(psql + ['-c', 'GRANT SELECT ON meta_ad_performance TO matrix_test_reader; REVOKE INSERT ON meta_coach_recommendations FROM matrix_test_reader'])
        result = run(command, cwd=ROOT, env={**env, 'EXPECT_INSERT_ERROR': '1'})
        print(result.stdout.strip())
    finally:
        if proxy: proxy.shutdown(); proxy.server_close()
        if thread: thread.join(timeout=3)
        if rest:
            rest.terminate()
            try: rest.wait(timeout=3)
            except subprocess.TimeoutExpired: rest.kill(); rest.wait(timeout=3)
        if started: run([str(PG/'pg_ctl'), '-D', str(pgdata), '-m', 'fast', '-w', 'stop'])
