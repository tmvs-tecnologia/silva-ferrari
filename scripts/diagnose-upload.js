const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const logFile = path.resolve(__dirname, 'diagnose.log');
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

function log(msg) {
    console.log(msg);
    logStream.write(msg + '\n');
}

function error(msg, err) {
    console.error(msg, err);
    logStream.write(`${msg} ${err}\n`);
    if (err && err.stack) logStream.write(err.stack + '\n');
}

// Try to load .env manually since we are not in Next.js context
const envPath = path.resolve(__dirname, '../.env.local');
const envPathBackup = path.resolve(__dirname, '../.env');

function loadEnv(filePath) {
    if (fs.existsSync(filePath)) {
        log(`Loading env from ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            const equalsIdx = trimmed.indexOf('=');
            if (equalsIdx > 0) {
                const key = trimmed.substring(0, equalsIdx).trim();
                let value = trimmed.substring(equalsIdx + 1).trim();

                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
}

loadEnv(envPath);
loadEnv(envPathBackup);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = 'juridico-documentos'; // Hardcoded as per source code

if (!SUPABASE_URL || !SUPABASE_KEY) {
    error('❌ Missing SUPABASE env vars');
    process.exit(1);
}

// DEBUG: Print URL
log(`DEBUG: SUPABASE_URL = '${SUPABASE_URL}'`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
    log(`--- Diagnosing Upload to ${BUCKET_NAME} ---`);

    try {
        // 1. List Buckets
        log("1. Listing buckets...");
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            error("❌ Failed to list buckets:", listError);
            if (listError.cause) error("Cause:", listError.cause);
        } else {
            log("✅ Buckets listed:");
            buckets.forEach(b => log(` - ${b.name} (public: ${b.public})`));

            const targetBucket = buckets.find(b => b.name === BUCKET_NAME);
            if (!targetBucket) {
                error(`❌ Target bucket '${BUCKET_NAME}' NOT FOUND!`);
            } else {
                log(`✅ Target bucket '${BUCKET_NAME}' exists.`);

                // 2. Try Upload
                log("\n2. Trying test upload...");
                const testFileName = `test-upload-${Date.now()}.txt`;
                const testContent = "Hello, Supabase!";
                const testPath = `diagnostics/${testFileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(testPath, Buffer.from(testContent), {
                        contentType: 'text/plain',
                        upsert: true
                    });

                if (uploadError) {
                    error("❌ Upload Failed:", uploadError);
                } else {
                    log("✅ Upload Successful:", JSON.stringify(uploadData));

                    // 3. Get Public URL
                    const { data: urlData } = supabase.storage
                        .from(BUCKET_NAME)
                        .getPublicUrl(testPath);
                    log("✅ Public URL: " + urlData.publicUrl);

                    // 4. Clean up (Delete)
                    log("\n3. Cleaning up...");
                    const { error: deleteError } = await supabase.storage
                        .from(BUCKET_NAME)
                        .remove([testPath]);

                    if (deleteError) {
                        error("❌ Failed to delete test file:", deleteError);
                    } else {
                        log("✅ Test file deleted.");
                    }
                }
            }
        }

    } catch (err) {
        error("❌ Unexpected error:", err);
    } finally {
        logStream.end();
    }
}

diagnose();
