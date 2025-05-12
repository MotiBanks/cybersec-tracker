// Simple script to update your handle
async function updateHandle() {
  const handleInput = document.getElementById('handle-input');
  const statusDiv = document.getElementById('status');
  const handle = handleInput.value.trim();
  
  if (!handle) {
    statusDiv.textContent = 'Please enter a handle';
    statusDiv.className = 'text-red-500';
    return;
  }
  
  statusDiv.textContent = 'Updating handle...';
  statusDiv.className = 'text-yellow-500';
  
  try {
    // Store in localStorage
    localStorage.setItem('userHandle', handle);
    
    // Get Supabase client
    const { createBrowserClient } = await import('/lib/supabase.js');
    const supabase = createBrowserClient();
    
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Not logged in');
    }
    
    // Update auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { 
        handle: handle,
        name: handle 
      }
    });
    
    if (authError) {
      throw new Error('Error updating auth: ' + authError.message);
    }
    
    // Update in users table
    const { error: dbError } = await supabase
      .from("users")
      .update({ handle: handle })
      .eq("id", userData.user.id);
    
    if (dbError) {
      throw new Error('Error updating database: ' + dbError.message);
    }
    
    statusDiv.textContent = 'Handle updated successfully! Refresh the page to see changes.';
    statusDiv.className = 'text-green-500';
  } catch (error) {
    console.error('Error:', error);
    statusDiv.textContent = 'Error: ' + error.message;
    statusDiv.className = 'text-red-500';
  }
}
