// TypeScript declaration file for @supabase/supabase-js
declare module '@supabase/supabase-js' {
  export interface SupabaseClient {
    auth: any;
    from(table: string): any;
    storage: any;
  }

  export interface User {
    id: string;
    email: string;
    // Add other user properties as needed
  }

  export interface Session {
    access_token: string;
    refresh_token: string;
    user: User;
  }

  export function createClient(url: string, key: string, options?: any): SupabaseClient;
}