import { ChildProcess, spawn, exec } from 'child_process';
import * as vscode from 'vscode';
import * as util from 'util';

const execAsync = util.promisify(exec);
const EXPECTED_VERSION = '0.2.3';

interface Pending {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
}

export class CoreBridge {
    private process: ChildProcess | undefined;
    private ready = false;
    private failed = false;
    private stderrBuffer = '';
    private pending = new Map<string, Pending>();
    private buffer = '';

    static expectedVersion(): string {
        return EXPECTED_VERSION;
    }

    static installCommand(python: string): string {
        return `${python} -m pip install --upgrade mindweaver-core==${EXPECTED_VERSION}`;
    }

    static whlInstallCommand(python: string, whlPath: string): string {
        return `${python} -m pip install --force-reinstall ${whlPath}`;
    }

    static async resolvePython(): Promise<string> {
        const configured = vscode.workspace.getConfiguration('mindweaver').get<string>('pythonPath');
        if (configured) {
            return configured;
        }

        const candidates = process.platform === 'win32'
            ? ['python', 'python3', 'py']
            : ['python3', 'python', 'python3.11', 'python3.12', 'python3.13'];

        for (const candidate of candidates) {
            try {
                await execAsync(`"${candidate}" --version`);
                return candidate;
            } catch {
                // try next
            }
        }
        throw new Error(`No Python 3.10+ interpreter found. Install Python and add it to PATH, then set "mindweaver.pythonPath" in VS Code settings.`);
    }

    static async checkVersion(python: string): Promise<string | undefined> {
        try {
            const { stdout } = await execAsync(`"${python}" -c "import mindweaver; print(mindweaver.__version__)"`);
            return stdout.trim();
        } catch {
            return undefined;
        }
    }

    async start(): Promise<void> {
        const python = await CoreBridge.resolvePython();
        const version = await CoreBridge.checkVersion(python);

        if (!version) {
            throw new Error(
                `mindweaver-core is not installed for the Python interpreter "${python}".\n\n` +
                `Run this in a terminal:\n${CoreBridge.installCommand(python)}\n\n` +
                `Or, if you have the .whl file:\n${CoreBridge.whlInstallCommand(python, 'mindweaver_core-0.2.3-py3-none-any.whl')}`
            );
        }

        if (version !== EXPECTED_VERSION) {
            throw new Error(
                `mindweaver-core version mismatch: found ${version}, expected ${EXPECTED_VERSION}.\n\n` +
                `Run this in a terminal:\n${CoreBridge.installCommand(python)}`
            );
        }

        return new Promise((resolve, reject) => {
            this.process = spawn(python, ['-m', 'mindweaver'], { stdio: ['pipe', 'pipe', 'pipe'] });

            const timeout = setTimeout(() => {
                this.failed = true;
                this.process?.kill();
                reject(new Error(`Mind Weaver core did not start within 10s.\n${this._diagnosticMessage()}`));
            }, 10000);

            const onStartError = (err: Error) => {
                clearTimeout(timeout);
                this.failed = true;
                reject(new Error(`Mind Weaver core failed to start: ${err.message}\n${this._diagnosticMessage()}`));
            };

            this.process.stderr?.on('data', (data) => {
                const text = data.toString();
                this.stderrBuffer += text;
                console.error(`[mindweaver core] ${text}`);
                if (text.includes('listening on stdio')) {
                    clearTimeout(timeout);
                    this.ready = true;
                    resolve();
                }
            });

            this.process.stdout?.on('data', (data) => {
                this._onData(data.toString());
            });

            this.process.on('exit', (code) => {
                if (!this.ready && !this.failed) {
                    clearTimeout(timeout);
                    this.failed = true;
                    reject(new Error(`Mind Weaver core exited with code ${code}.\n${this._diagnosticMessage()}`));
                }
                console.log(`[mindweaver core] exited with ${code}`);
                this.ready = false;
                this._rejectAll(new Error('Core process exited'));
            });

            this.process.on('error', (err) => {
                if (!this.ready && !this.failed) {
                    clearTimeout(timeout);
                    this.failed = true;
                    onStartError(err);
                }
            });
        });
    }

    stop() {
        if (this.process && !this.process.killed) {
            this.process.kill();
        }
        this._rejectAll(new Error('Core stopped'));
    }

    private _diagnosticMessage(): string {
        const hint = this.stderrBuffer.trim() || 'no output';
        return `Diagnosi: ${hint}\n\nCose da controllare:\n- "pip install mindweaver-core==${EXPECTED_VERSION}"\n- il Python in "mindweaver.pythonPath" punti al giusto interpreter\n- il file "~/.config/mindweaver/config.yaml" esista con le API key`;
    }

    private _onData(chunk: string) {
        this.buffer += chunk;
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';
        for (const line of lines) {
            if (!line.trim()) { continue; }
            try {
                const res = JSON.parse(line);
                if (res.id && this.pending.has(res.id)) {
                    const p = this.pending.get(res.id)!;
                    this.pending.delete(res.id);
                    if (res.error) {
                        p.reject(new Error(res.error.message));
                    } else {
                        p.resolve(res.result);
                    }
                }
            } catch (e) {
                console.error('[mindweaver core] invalid JSON line', line);
            }
        }
    }

    private _rejectAll(err: Error) {
        for (const p of this.pending.values()) {
            p.reject(err);
        }
        this.pending.clear();
    }

    async call(method: string, params: unknown): Promise<unknown> {
        if (!this.process || !this.ready || this.failed) {
            throw new Error(`Core not ready.\n${this._diagnosticMessage()}`);
        }
        const id = Math.random().toString(36).slice(2);
        const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params });
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.process!.stdin?.write(payload + '\n');
        });
    }
}
