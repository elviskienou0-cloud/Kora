-- Enforce bounded, image-only avatar uploads at the Storage service layer.
-- Keep the bucket public because public profile/avatar rendering depends on it.
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ]::text[]
WHERE id = 'avatars';

-- Fail loudly if the expected bucket is absent; do not silently mark the
-- migration successful without applying the intended hardening.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'avatars'
      AND file_size_limit = 5242880
      AND allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif'
      ]::text[]
  ) THEN
    RAISE EXCEPTION 'KORA avatars bucket hardening did not apply as expected';
  END IF;
END
$$;
