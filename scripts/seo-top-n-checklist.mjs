#!/usr/bin/env node
import { runChecklist } from './lib/top-n-checklist.mjs';

async function main() {
    const findings = await runChecklist();
    const errors = findings.filter((f) => f.severity === 'error');
    const warnings = findings.filter((f) => f.severity === 'warn');
    const infos = findings.filter((f) => f.severity === 'info');

    for (const f of findings) {
        const prefix =
            f.severity === 'error'
                ? 'ERROR'
                : f.severity === 'warn'
                  ? 'WARN'
                  : 'INFO';
        console.log(`${prefix} ${f.slug}: [${f.rule}] ${f.message}`);
    }

    console.log(
        `\nChecklist errors: ${errors.length}, warnings: ${warnings.length}, info: ${infos.length}`
    );
    process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
