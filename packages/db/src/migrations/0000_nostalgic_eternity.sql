CREATE TABLE "github_user" (
	"id" integer PRIMARY KEY NOT NULL,
	"login" text NOT NULL,
	"name" text,
	"email" text,
	"avatar_url" text,
	"bio" text,
	"location" text,
	"company" text,
	"blog" text,
	"public_repos" integer,
	"followers" integer,
	"following" integer,
	"github_created_at" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
