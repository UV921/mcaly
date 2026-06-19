import "dotenv/config"
import { Pool } from "pg"

const CREATE_USER_SETTINGS_SQL = `
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  gemini_api_key_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

export async function ensureUserSettingsTable(pool?: Pool): Promise<void> {
  const client = pool ?? new Pool({ connectionString: process.env.DB_URI })
  const ownsPool = !pool

  try {
    await client.query(CREATE_USER_SETTINGS_SQL)
  } finally {
    if (ownsPool) {
      await client.end()
    }
  }
}

if (process.argv[1]?.includes("ensure-user-settings")) {
  ensureUserSettingsTable()
    .then(() => {
      console.log("user_settings table is ready")
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
