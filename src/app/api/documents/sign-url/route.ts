import { NextRequest, NextResponse } from 'next/server';
import { BUCKET_NAME } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { filePath } = await request.json();

    if (!filePath) {
      console.warn('API sign-url: Missing filePath');
      return NextResponse.json({ error: 'FilePath required' }, { status: 400 });
    }

    let path = filePath;
    // Extract path from full URL if necessary
    if (path.startsWith('http')) {
        // Try to find the bucket name in the URL
        const bucketSegment = `/${BUCKET_NAME}/`;
        const index = path.indexOf(bucketSegment);
        
        if (index !== -1) {
            path = path.substring(index + bucketSegment.length);
        } else {
            // Fallback: check for /object/public/ pattern which is standard for Supabase
            const publicMarker = '/object/public/';
            const publicIndex = path.indexOf(publicMarker);
            if (publicIndex !== -1) {
                // Remove everything before and including /object/public/
                let tempPath = path.substring(publicIndex + publicMarker.length);
                // Now we have BUCKET/path/to/file. We need to remove the bucket name.
                // We assume the bucket name is the first segment.
                const firstSlash = tempPath.indexOf('/');
                if (firstSlash !== -1) {
                    tempPath = tempPath.substring(firstSlash + 1);
                }
                path = tempPath;
            }
        }
    } else {
        // Handle cases where path starts with bucket name but is not a URL
        const bucketPrefixSlash = `/${BUCKET_NAME}/`;
        const bucketPrefix = `${BUCKET_NAME}/`;
        
        if (path.startsWith(bucketPrefixSlash)) {
            path = path.substring(bucketPrefixSlash.length);
        } else if (path.startsWith(bucketPrefix)) {
            path = path.substring(bucketPrefix.length);
        }
    }
    
    // Remove query params if any
    path = path.split('?')[0];
    
    // Decode URI components
    path = decodeURIComponent(path);

    console.log('API sign-url: Generating for path:', path);

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 60 * 60); // 1 hour validity

    if (error) {
      console.error('API sign-url: Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.signedUrl) {
        console.error('API sign-url: No signedUrl returned');
        return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });

  } catch (error) {
    console.error('API sign-url: Server error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
