import 'dotenv/config';
import { Pool } from 'pg';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';

const db = new Pool({ connectionString: process.env.DB_URI });

 export const corsair = createCorsair({
    plugins: [gmail({
        authType: "oauth_2",
        // cautious: reads + writes (send email, create event) run freely.
        // Only destructive actions need approval. "strict" blocked sends with
        // no approval UI — that's why Mcaly said "no permission".
        permissions: { mode: "cautious" },
    }),googlecalendar({
        authType:"oauth_2",
        permissions: { mode: "cautious" },
    })],
    database: db,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});


