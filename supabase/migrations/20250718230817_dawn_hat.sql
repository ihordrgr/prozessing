/*
  # VIP Access System Database Schema

  1. New Tables
    - `profiles` - User profiles linked to Supabase auth
      - `id` (uuid, references auth.users)
      - `telegram_id` (bigint, unique)
      - `username` (text)
      - `full_name` (text)
      - `vip_access` (boolean, default false)
      - `access_expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `payments` - Payment records and verification
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `telegram_id` (bigint)
      - `amount` (decimal)
      - `currency` (text, default 'RUB')
      - `payment_method` (text)
      - `screenshot_url` (text)
      - `status` (text, default 'pending')
      - `verified_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `access_links` - Generated VIP access links
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `access_code` (text, unique)
      - `link_url` (text)
      - `expires_at` (timestamptz)
      - `used_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for service role operations

  3. Functions
    - Function to verify payments
    - Function to generate access links
    - Function to check user access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id bigint UNIQUE,
  username text,
  full_name text,
  vip_access boolean DEFAULT false,
  access_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  telegram_id bigint NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 500.00,
  currency text DEFAULT 'RUB',
  payment_method text,
  screenshot_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create access_links table
CREATE TABLE IF NOT EXISTS access_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  access_code text UNIQUE NOT NULL,
  link_url text NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create user_actions table for analytics
CREATE TABLE IF NOT EXISTS user_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  telegram_id bigint,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true);

-- Payments policies
CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all payments"
  ON payments
  FOR ALL
  TO service_role
  USING (true);

-- Access links policies
CREATE POLICY "Users can read own access links"
  ON access_links
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all access links"
  ON access_links
  FOR ALL
  TO service_role
  USING (true);

-- User actions policies
CREATE POLICY "Users can read own actions"
  ON user_actions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all actions"
  ON user_actions
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_payments_telegram_id ON payments(telegram_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_access_links_code ON access_links(access_code);
CREATE INDEX IF NOT EXISTS idx_access_links_expires ON access_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_telegram_id ON user_actions(telegram_id);

-- Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to verify payment and grant access
CREATE OR REPLACE FUNCTION verify_payment_and_grant_access(
  payment_id uuid,
  verified boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_record payments;
  profile_record profiles;
  access_link_record access_links;
  result json;
BEGIN
  -- Get payment record
  SELECT * INTO payment_record FROM payments WHERE id = payment_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payment not found');
  END IF;
  
  IF verified THEN
    -- Update payment status
    UPDATE payments 
    SET status = 'verified', verified_at = now()
    WHERE id = payment_id;
    
    -- Update or create user profile
    INSERT INTO profiles (id, telegram_id, vip_access, access_expires_at)
    VALUES (
      gen_random_uuid(),
      payment_record.telegram_id,
      true,
      now() + interval '30 days'
    )
    ON CONFLICT (telegram_id) 
    DO UPDATE SET 
      vip_access = true,
      access_expires_at = now() + interval '30 days',
      updated_at = now();
    
    -- Get updated profile
    SELECT * INTO profile_record FROM profiles WHERE telegram_id = payment_record.telegram_id;
    
    -- Generate access link
    INSERT INTO access_links (user_id, access_code, link_url)
    VALUES (
      profile_record.id,
      'VIP_' || upper(substring(gen_random_uuid()::text from 1 for 12)),
      'https://t.me/joinchat/VIP_' || upper(substring(gen_random_uuid()::text from 1 for 12))
    )
    RETURNING * INTO access_link_record;
    
    -- Log action
    INSERT INTO user_actions (user_id, telegram_id, action, details)
    VALUES (
      profile_record.id,
      payment_record.telegram_id,
      'payment_verified',
      json_build_object('payment_id', payment_id, 'amount', payment_record.amount)
    );
    
    result := json_build_object(
      'success', true,
      'access_link', access_link_record.link_url,
      'expires_at', profile_record.access_expires_at
    );
  ELSE
    -- Reject payment
    UPDATE payments 
    SET status = 'rejected'
    WHERE id = payment_id;
    
    result := json_build_object('success', false, 'error', 'Payment rejected');
  END IF;
  
  RETURN result;
END;
$$;

-- Function to check user VIP access
CREATE OR REPLACE FUNCTION check_vip_access(user_telegram_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record profiles;
  result json;
BEGIN
  SELECT * INTO profile_record 
  FROM profiles 
  WHERE telegram_id = user_telegram_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('has_access', false, 'reason', 'User not found');
  END IF;
  
  IF NOT profile_record.vip_access THEN
    RETURN json_build_object('has_access', false, 'reason', 'No VIP access');
  END IF;
  
  IF profile_record.access_expires_at < now() THEN
    -- Update expired access
    UPDATE profiles 
    SET vip_access = false 
    WHERE telegram_id = user_telegram_id;
    
    RETURN json_build_object('has_access', false, 'reason', 'Access expired');
  END IF;
  
  RETURN json_build_object(
    'has_access', true,
    'expires_at', profile_record.access_expires_at
  );
END;
$$;