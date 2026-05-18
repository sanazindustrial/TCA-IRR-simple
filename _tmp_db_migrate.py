import asyncio, asyncpg, os, sys
async def main():
    conn = await asyncpg.connect("postgresql://tcairrserver:Tc%401rr53rv5r@tca-irr-server.postgres.database.azure.com:5432/tca_platform?sslmode=require")
    try:
        # 1. companies.industry
        try:
            await conn.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry TEXT")
            print("OK: companies.industry added (or already exists)")
        except Exception as e:
            print(f"ERR companies.industry: {e}")
        # 2. evaluations.evaluation_type — table may be named evaluations OR evaluations_simple
        for tbl in ("evaluations", "evaluations_simple"):
            try:
                await conn.execute(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS evaluation_type TEXT DEFAULT 'triage'")
                print(f"OK: {tbl}.evaluation_type added (or already exists)")
            except Exception as e:
                print(f"SKIP {tbl}: {e}")
        # 3. Identify any tables that look up company_id-like columns to help dashboard
        rows = await conn.fetch("""
            SELECT table_name, column_name FROM information_schema.columns
            WHERE table_schema='public' AND column_name IN ('company_id','company_name')
            ORDER BY table_name, column_name
        """)
        print("--- Tables with company_id/company_name ---")
        for r in rows: print(f"  {r['table_name']}.{r['column_name']}")
        # 4. Verify columns now exist
        rows = await conn.fetch("""SELECT column_name FROM information_schema.columns WHERE table_name='companies' ORDER BY ordinal_position""")
        print("--- companies columns ---")
        print(", ".join(r['column_name'] for r in rows))
        for tbl in ("evaluations", "evaluations_simple", "company_analyses"):
            rows = await conn.fetch(f"""SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position""", tbl)
            if rows:
                print(f"--- {tbl} columns ---")
                print(", ".join(r['column_name'] for r in rows))
            else:
                print(f"--- {tbl}: TABLE NOT FOUND ---")
    finally:
        await conn.close()
asyncio.run(main())
