export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          two_fa_enabled: boolean
          two_fa_secret: string | null
          backup_codes: string[] | null
          stripe_customer_id: string | null
          subscription_plan: 'free' | 'starter' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | null
          subscription_end_date: string | null
          trial_ends_at: string | null
          elections_limit: number
          voters_per_election_limit: number
          onboarded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          two_fa_enabled?: boolean
          two_fa_secret?: string | null
          backup_codes?: string[] | null
          stripe_customer_id?: string | null
          subscription_plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing' | null
          subscription_end_date?: string | null
          trial_ends_at?: string | null
          elections_limit?: number
          voters_per_election_limit?: number
          onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          two_fa_enabled?: boolean
          two_fa_secret?: string | null
          backup_codes?: string[] | null
          stripe_customer_id?: string | null
          subscription_plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing' | null
          subscription_end_date?: string | null
          trial_ends_at?: string | null
          elections_limit?: number
          voters_per_election_limit?: number
          onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      elections: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          vote_type: 'simple' | 'approval' | 'ranked' | 'list'
          is_secret: boolean
          is_weighted: boolean
          allow_abstention: boolean
          quorum_type: 'none' | 'percentage' | 'absolute' | 'weighted'
          quorum_value: number | null
          quorum_reached: boolean
          start_date: string | null
          end_date: string | null
          actual_start_date: string | null
          actual_end_date: string | null
          meeting_platform: 'teams' | 'zoom' | 'custom' | null
          meeting_url: string | null
          meeting_password: string | null
          status: 'draft' | 'scheduled' | 'active' | 'closed' | 'archived'
          results_visible: boolean
          results_published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          vote_type: 'simple' | 'approval' | 'ranked' | 'list'
          is_secret?: boolean
          is_weighted?: boolean
          allow_abstention?: boolean
          quorum_type?: 'none' | 'percentage' | 'absolute' | 'weighted'
          quorum_value?: number | null
          quorum_reached?: boolean
          start_date?: string | null
          end_date?: string | null
          actual_start_date?: string | null
          actual_end_date?: string | null
          meeting_platform?: 'teams' | 'zoom' | 'custom' | null
          meeting_url?: string | null
          meeting_password?: string | null
          status?: 'draft' | 'scheduled' | 'active' | 'closed' | 'archived'
          results_visible?: boolean
          results_published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          vote_type?: 'simple' | 'approval' | 'ranked' | 'list'
          is_secret?: boolean
          is_weighted?: boolean
          allow_abstention?: boolean
          quorum_type?: 'none' | 'percentage' | 'absolute' | 'weighted'
          quorum_value?: number | null
          quorum_reached?: boolean
          start_date?: string | null
          end_date?: string | null
          actual_start_date?: string | null
          actual_end_date?: string | null
          meeting_platform?: 'teams' | 'zoom' | 'custom' | null
          meeting_url?: string | null
          meeting_password?: string | null
          status?: 'draft' | 'scheduled' | 'active' | 'closed' | 'archived'
          results_visible?: boolean
          results_published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      candidates: {
        Row: {
          id: string
          election_id: string
          name: string
          description: string | null
          position: number
          list_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          election_id: string
          name: string
          description?: string | null
          position: number
          list_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          name?: string
          description?: string | null
          position?: number
          list_name?: string | null
          created_at?: string
        }
      }
      voters: {
        Row: {
          id: string
          election_id: string
          email: string
          name: string | null
          weight: number
          token: string
          has_voted: boolean
          voted_at: string | null
          invitation_sent_at: string | null
          invitation_opened_at: string | null
          invitation_clicked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          election_id: string
          email: string
          name?: string | null
          weight?: number
          token?: string
          has_voted?: boolean
          voted_at?: string | null
          invitation_sent_at?: string | null
          invitation_opened_at?: string | null
          invitation_clicked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          email?: string
          name?: string | null
          weight?: number
          token?: string
          has_voted?: boolean
          voted_at?: string | null
          invitation_sent_at?: string | null
          invitation_opened_at?: string | null
          invitation_clicked_at?: string | null
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          election_id: string
          voter_id: string
          encrypted_vote: string
          vote_hash: string
          iv: string
          auth_tag: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          election_id: string
          voter_id: string
          encrypted_vote: string
          vote_hash: string
          iv: string
          auth_tag: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          voter_id?: string
          encrypted_vote?: string
          vote_hash?: string
          iv?: string
          auth_tag?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          secret: string | null
          events: string[]
          is_active: boolean
          last_triggered_at: string | null
          success_count: number
          failure_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          secret?: string | null
          events?: string[]
          is_active?: boolean
          last_triggered_at?: string | null
          success_count?: number
          failure_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          secret?: string | null
          events?: string[]
          is_active?: boolean
          last_triggered_at?: string | null
          success_count?: number
          failure_count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cast_vote_atomic: {
        Args: {
          p_election_id: string
          p_voter_id: string
          p_encrypted_vote: string
          p_vote_hash: string
          p_iv: string
          p_auth_tag: string
          p_ip: string
          p_user_agent: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
