import { ChildProcess, spawn } from 'child_process';
import * as vscode from 'vscode';

interface Pending {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
}

export class CoreBridge {
    private process: ChildProcess | undefined;
    private ready = false;
    private pending = new Map<string, Pending>();
    private buffer = '';

    start() {
        const python = vscode.workspace.getConfiguration('mindweaver').get<string>('pythonPath') || 'python3';
        this.process = spawn(python, ['-m', 'mindweaver'], { stdio: ['pipe', 'pipe', 'pipe'] });
        this.process.stderr?.on('data', (data) => {
            console.error(`[mindweaver core] ${data.toString()}`);
        });
        this.process.stdout?.on('data', (data) => {
            this._onData(data.toString());
        });
        this.process.on('exit', (code) => {
            console.log(`[mindweaver core] exited with ${code}`);
            this.ready = false;
            this._rejectAll(new Error('Core process exited'));
        });
        this.process.on('error', (err) => {
            console.error(`[mindweaver core] error ${err}`);
            this.ready = false;
            this._rejectAll(err);
        });
        this.ready = true;
    }

    stop() {
        if (this.process && !this.process.killed) {
            this.process.kill();
        }
        this._rejectAll(new Error('Core stopped'));
    }

    private _onData(chunk: string) {
        this.buffer += chunk;
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';
        for (const line of lines) {
            if (!line.trim()) continue;
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
        if (!this.process || !this.ready) {
            throw new Error('Core not ready');
        }
        const id = Math.random().toString(36).slice(2);
        const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params });
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.process!.stdin?.write(payload + '\n');
        });
    }
}