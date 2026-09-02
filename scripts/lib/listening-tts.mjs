/**
 * Offline Piper + ffmpeg TTS for listening cards (SYNC-02).
 * Soft-fail only — never process.exit. Piper is OS/pip tooling, not a yarn dep (D-07).
 *
 * Env (local/CI only — never PUBLIC_*):
 *   PIPER_VOICE     — default en_US-amy-medium (D-08)
 *   PIPER_DATA_DIR  — voice cache dir (default ~/.cache/piper)
 */
import { spawnSync } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    rmSync,
    unlinkSync,
} from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const DEFAULT_VOICE = 'en_US-amy-medium';

/**
 * @param {import('node:child_process').SpawnSyncReturns<string>} result
 * @param {string} label
 * @returns {string | null} error message or null if ok
 */
function spawnError(result, label) {
    if (result.error) {
        return `${label}: ${result.error.message}`;
    }
    if (result.status !== 0) {
        const stderr = (result.stderr || '').trim();
        const stdout = (result.stdout || '').trim();
        const detail = stderr || stdout || `exit ${result.status}`;
        return `${label}: ${detail}`;
    }
    return null;
}

/**
 * Synthesize sentence audio to public/audio/listening/<id>.mp3.
 * On any Piper/ffmpeg failure returns { ok: false } without throwing or exiting.
 *
 * @param {{
 *   id: string,
 *   sentence: string,
 *   outDir: string,
 *   voice?: string,
 *   dataDir?: string,
 * }} opts
 * @returns {{ ok: true, audioSrc: string } | { ok: false, error: string }}
 */
export function synthesizeListeningMp3(opts) {
    const id = typeof opts?.id === 'string' ? opts.id.trim() : '';
    const sentence = typeof opts?.sentence === 'string' ? opts.sentence : '';
    const outDir = typeof opts?.outDir === 'string' ? opts.outDir : '';

    if (!id) {
        return { ok: false, error: 'missing id' };
    }
    if (!sentence.trim()) {
        return { ok: false, error: 'missing sentence' };
    }
    if (!outDir) {
        return { ok: false, error: 'missing outDir' };
    }

    const voice =
        (typeof opts.voice === 'string' && opts.voice.trim()) ||
        process.env.PIPER_VOICE ||
        DEFAULT_VOICE;
    const dataDir =
        (typeof opts.dataDir === 'string' && opts.dataDir.trim()) ||
        process.env.PIPER_DATA_DIR ||
        path.join(homedir(), '.cache', 'piper');

    const audioSrc = `audio/listening/${id}.mp3`;
    const mp3Path = path.join(outDir, `${id}.mp3`);

    // Repo-root scratch (gitignored **/listening-tts-scratch/) — outDir is public/audio/listening
    const scratchDir = path.resolve(outDir, '../../../listening-tts-scratch');
    const wavPath = path.join(scratchDir, `${id}.wav`);

    try {
        mkdirSync(outDir, { recursive: true });
        mkdirSync(scratchDir, { recursive: true });

        const piper = spawnSync(
            'python3',
            [
                '-m',
                'piper',
                '-m',
                voice,
                '--data-dir',
                dataDir,
                '-f',
                wavPath,
                '--',
                sentence,
            ],
            {
                encoding: 'utf8',
                // Do not inherit env secrets into logs; spawn still gets process.env for PATH.
                env: process.env,
            }
        );
        const piperErr = spawnError(piper, 'piper');
        if (piperErr) {
            return { ok: false, error: piperErr };
        }
        if (!existsSync(wavPath)) {
            return { ok: false, error: 'piper: wav not written' };
        }

        const ffmpeg = spawnSync(
            'ffmpeg',
            ['-y', '-i', wavPath, '-codec:a', 'libmp3lame', '-q:a', '4', mp3Path],
            { encoding: 'utf8', env: process.env }
        );
        const ffmpegErr = spawnError(ffmpeg, 'ffmpeg');
        if (ffmpegErr) {
            return { ok: false, error: ffmpegErr };
        }
        if (!existsSync(mp3Path)) {
            return { ok: false, error: 'ffmpeg: mp3 not written' };
        }

        return { ok: true, audioSrc };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
    } finally {
        try {
            if (existsSync(wavPath)) unlinkSync(wavPath);
        } catch {
            // ignore cleanup
        }
        try {
            if (existsSync(scratchDir)) {
                // Remove empty scratch dir if possible; leave if other files remain
                rmSync(scratchDir, { recursive: true, force: true });
            }
        } catch {
            // ignore cleanup
        }
    }
}
