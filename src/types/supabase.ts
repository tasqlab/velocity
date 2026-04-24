export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      channels: {
        Row: {
          created_at: string | null
          id: string
          name: string
          server_id: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          server_id: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          server_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          role: string | null
          server_id: string
          user_id: string
        }
        Insert: {
          role?: string | null
          server_id: string
          user_id: string
        }
        Update: {
          role?: string | null
          server_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          status: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          status?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          username?: string
        }
        Relationships: []
      }
      servers: {
        Row: {
          created_at: string | null
          icon_url: string | null
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
