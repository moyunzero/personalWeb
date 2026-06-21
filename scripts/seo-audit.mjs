#!/usr/bin/env node
import { scanPosts } from './lib/scan-posts.mjs';
import { runAuditRules } from './lib/meta-rules.mjs';

async function main() {
    const posts = await scanPosts();
    const findings = await runAuditRules(posts);
    const errors = findings.filter((f) => f.severity === 'error');
    const warnings = findings.filter((f) => f.severity === 'warn');

    for (const f of findings) {
        const prefix = f.severity === 'error' ? 'ERROR' : 'WARN';
        console.log(`${prefix} ${f.file}: [${f.rule}] ${f.message}`);
    }

    console.log(`\nAudit: ${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
