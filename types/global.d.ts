// Type declarations for modules without type definitions

declare module '@supabase/ssr' {
  import { SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js';
  import { Database } from './database.types';

  export function createServerClient<T = Database>(
    supabaseUrl: string,
    supabaseKey: string,
    options: {
      cookies: {
        get(name: string): string | undefined;
        set(name: string, value: string, options: any): void;
        remove(name: string, options: any): void;
      };
    }
  ): SupabaseClient<T>;
}

declare module '@supabase/auth-ui-react' {
  import { ReactNode } from 'react';
  import { SupabaseClient } from '@supabase/supabase-js';

  export interface AuthProps {
    supabaseClient: SupabaseClient;
    appearance?: {
      theme?: 'default' | 'dark';
      variables?: Record<string, any>;
      className?: {
        anchor?: string;
        button?: string;
        container?: string;
        divider?: string;
        input?: string;
        label?: string;
        loader?: string;
        message?: string;
      };
    };
    theme?: 'default' | 'dark';
    providers?: ('google' | 'facebook' | 'twitter' | 'github')[];
    redirectTo?: string;
    onlyThirdPartyProviders?: boolean;
    magicLink?: boolean;
    showLinks?: boolean;
    localization?: {
      variables?: Record<string, any>;
    };
    children?: ReactNode;
  }

  export function Auth(props: AuthProps): JSX.Element;
}

declare module '@supabase/auth-ui-shared' {
  export const ThemeSupa: {
    default: Record<string, any>;
    dark: Record<string, any>;
  };
}

// Add JSX namespace to fix JSX element type errors
namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
