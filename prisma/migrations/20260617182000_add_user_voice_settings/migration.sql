CREATE TABLE "user_voice_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "input_device_id" TEXT,
    "output_device_id" TEXT,
    "input_volume" INTEGER NOT NULL DEFAULT 100,
    "output_volume" INTEGER NOT NULL DEFAULT 100,
    "input_mode" TEXT NOT NULL DEFAULT 'voice_activity',
    "auto_sensitivity" BOOLEAN NOT NULL DEFAULT true,
    "sensitivity" INTEGER NOT NULL DEFAULT 55,
    "push_to_talk_key" TEXT,
    "noise_suppression" BOOLEAN NOT NULL DEFAULT true,
    "echo_cancellation" BOOLEAN NOT NULL DEFAULT true,
    "auto_gain_control" BOOLEAN NOT NULL DEFAULT true,
    "voice_isolation" BOOLEAN NOT NULL DEFAULT false,
    "attenuation" INTEGER NOT NULL DEFAULT 0,
    "join_muted" BOOLEAN NOT NULL DEFAULT false,
    "join_deafened" BOOLEAN NOT NULL DEFAULT false,
    "show_voice_warnings" BOOLEAN NOT NULL DEFAULT true,
    "show_speaking_indicators" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_voice_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_voice_settings_user_id_key" ON "user_voice_settings"("user_id");
CREATE INDEX "user_voice_settings_user_id_idx" ON "user_voice_settings"("user_id");

ALTER TABLE "user_voice_settings"
ADD CONSTRAINT "user_voice_settings_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
