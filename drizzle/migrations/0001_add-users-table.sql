CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(256) NOT NULL,
	"full_name" varchar(256) NOT NULL,
	"phone" varchar(32),
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "email" TO "signing_email"; -- safe: new column name, code updated in same deploy
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "contact_user_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "contact_name"; -- safe: replaced by users.full_name via contact_user_id
--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "phone"; -- safe: moved to users table
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_org" ON "users" USING btree ("org_id"); -- safe: new table, no existing rows
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
