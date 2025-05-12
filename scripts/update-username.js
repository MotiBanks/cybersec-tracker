// Script to update a user's username in the database
const { createClient } = require('@supabase/supabase-js');

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUsername(email, newUsername) {
  try {
    console.log(`Attempting to update username for ${email} to ${newUsername}...`);
    
    // First, get the user ID from the auth.users table using the email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError.message);
      return;
    }
    
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`No user found with email: ${email}`);
      return;
    }
    
    console.log(`Found user with ID: ${user.id}`);
    
    // Update the username in the public.users table
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ username: newUsername })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Error updating username:', updateError.message);
      return;
    }
    
    console.log(`Username updated successfully to: ${newUsername}`);
    
    // Also update the user's metadata
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      user.id,
      { user_metadata: { handle: newUsername } }
    );
    
    if (metadataError) {
      console.error('Error updating user metadata:', metadataError.message);
      return;
    }
    
    console.log('User metadata updated successfully');
    
    // Also store in localStorage for immediate use
    if (typeof window !== 'undefined') {
      localStorage.setItem('userHandle', newUsername);
    }
    
    console.log('Update complete!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Usage example (replace with actual email and desired username)
// updateUsername('your-email@example.com', 'YourDesiredUsername');

module.exports = { updateUsername };
