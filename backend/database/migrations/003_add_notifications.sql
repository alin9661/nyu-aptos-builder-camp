-- Migration: Add Notifications System
-- Description: Creates tables for user notifications, notification queue, and preferences

-- Create user_notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(66) NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  CONSTRAINT fk_user_address
    FOREIGN KEY(user_address)
    REFERENCES users(address)
    ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_address);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON user_notifications(user_address, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_category ON user_notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON user_notifications(notification_type);

-- Create notification_queue table for async email processing
CREATE TABLE IF NOT EXISTS notification_queue (
  id BIGSERIAL PRIMARY KEY,
  notification_data JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_created ON notification_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_status_retry ON notification_queue(status, retry_count) WHERE status = 'pending';

-- Add notification preferences column to users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'notification_preferences'
    ) THEN
        ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "inApp": true, "security": true, "education": true}'::jsonb;
    END IF;
END $$;

-- Add last_email_sent_at column for rate limiting
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_email_sent_at'
    ) THEN
        ALTER TABLE users ADD COLUMN last_email_sent_at TIMESTAMP;
    END IF;
END $$;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notification_queue updated_at
DROP TRIGGER IF EXISTS update_notification_queue_updated_at ON notification_queue;
CREATE TRIGGER update_notification_queue_updated_at
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_notifications IS 'In-app notifications for users';
COMMENT ON TABLE notification_queue IS 'Queue for processing email notifications asynchronously';

COMMENT ON COLUMN user_notifications.user_address IS 'Aptos wallet address of the user';
COMMENT ON COLUMN user_notifications.notification_type IS 'Type of notification (wallet_created, wallet_funded, security_reminder, education)';
COMMENT ON COLUMN user_notifications.category IS 'Category for filtering (wallet, security, governance, reimbursement)';
COMMENT ON COLUMN user_notifications.priority IS 'Priority level (low, normal, high, urgent)';
COMMENT ON COLUMN user_notifications.metadata IS 'Additional structured data in JSON format';
COMMENT ON COLUMN user_notifications.expires_at IS 'Optional expiration timestamp for temporary notifications';

COMMENT ON COLUMN notification_queue.notification_data IS 'Serialized notification data including recipient and content';
COMMENT ON COLUMN notification_queue.status IS 'Processing status (pending, processing, completed, failed)';
COMMENT ON COLUMN notification_queue.retry_count IS 'Number of retry attempts (max 3)';
COMMENT ON COLUMN notification_queue.last_error IS 'Error message from last failed attempt';

COMMENT ON COLUMN users.notification_preferences IS 'User preferences for notifications (email, inApp, security, education)';
COMMENT ON COLUMN users.last_email_sent_at IS 'Timestamp of last email sent for rate limiting';

-- Insert some sample notifications for testing (optional)
-- Uncomment these lines if you want to insert test data
/*
INSERT INTO user_notifications (
  user_address,
  notification_type,
  title,
  message,
  category,
  priority,
  action_url,
  action_label
) VALUES (
  (SELECT address FROM users LIMIT 1),
  'wallet_created',
  'Welcome! Your Aptos Wallet is Ready',
  'Your Aptos wallet has been created successfully. You can now participate in governance.',
  'wallet',
  'high',
  '/wallet',
  'View Wallet'
);
*/

-- Create view for unread notification counts per user
CREATE OR REPLACE VIEW user_unread_notification_counts AS
SELECT
  user_address,
  COUNT(*) as unread_count
FROM user_notifications
WHERE read = false
  AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY user_address;

COMMENT ON VIEW user_unread_notification_counts IS 'Quick lookup for unread notification counts per user';
