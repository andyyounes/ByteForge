// ============================================================
//  ByteForge — Supabase generated type stub
//
//  Replace with real generated types once the schema is live:
//    npx supabase gen types typescript --project-id <id> > types/supabase.ts
//
//  This permissive stub lets all queries compile until then.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type TableDef = {
  Row:           { [column: string]: unknown }
  Insert:        { [column: string]: unknown }
  Update:        { [column: string]: unknown }
  Relationships: unknown[]
}

export interface Database {
  public: {
    Tables:    { [tableName: string]: TableDef }
    Views:     { [viewName: string]: { Row: { [column: string]: unknown } } }
    Functions: { [fnName: string]: { Args: Record<string, unknown>; Returns: unknown } }
    Enums:     { [enumName: string]: string }
    CompositeTypes: { [typeName: string]: { [key: string]: unknown } }
  }
}
