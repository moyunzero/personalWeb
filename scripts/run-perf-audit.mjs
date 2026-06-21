#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const PREVIEW_URL = 'http://localhost:4321/personalWeb/';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function isPreviewUp() {
    try {
        const res = await fetch(PREVIEW_URL, { method: 'HEAD' });
        return res.ok;
    } catch {
        return false;
    }
}

function run(cmd, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, {
            cwd: root,
            stdio: 'inherit',
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${cmd} exited ${code}`));
        });
    });
}

async function main() {
    let spawnedPreview = false;
    let previewProc = null;

    if (!(await isPreviewUp())) {
        console.log('Starting yarn preview…');
        spawnedPreview = true;
        previewProc = spawn('yarn', ['preview'], {
            cwd: root,
            stdio: 'inherit',
            detached: true,
        });

        for (let i = 0; i < 45; i += 1) {
            if (await isPreviewUp()) break;
            await delay(1000);
        }

        if (!(await isPreviewUp())) {
            throw new Error('Preview server did not start on :4321');
        }
    }

    try {
        await run('lhci', ['autorun']);
    } finally {
        if (spawnedPreview && previewProc?.pid) {
            try {
                process.kill(-previewProc.pid);
            } catch {
                /* ignore */
            }
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
