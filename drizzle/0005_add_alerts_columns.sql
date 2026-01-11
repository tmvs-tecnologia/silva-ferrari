ALTER TABLE "alerts" ADD COLUMN "data" text;
ALTER TABLE "alerts" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;
ALTER TABLE "alerts" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "alerts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
