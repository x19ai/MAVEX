// Simple test script to check message saving
const { createClient } = require('@supabase/supabase-js')

// This is just for testing - you'll need to add your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('Supabase credentials not found in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMessageSaving() {
  const testChatId = 'test-chat-' + Date.now()
  const testMessage = {
    chat_id: testChatId,
    role: 'assistant',
    content: 'This is a test assistant message',
    created_at: new Date().toISOString()
  }

  console.log('Testing message insertion...')
  
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert(testMessage)
      .select()

    if (error) {
      console.error('Error inserting message:', error)
      return
    }

    console.log('Message inserted successfully:', data)

    // Now try to retrieve it
    console.log('Testing message retrieval...')
    const { data: retrieved, error: retrieveError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', testChatId)
      .order('created_at', { ascending: true })

    if (retrieveError) {
      console.error('Error retrieving messages:', retrieveError)
      return
    }

    console.log('Retrieved messages:', retrieved)

    // Clean up
    await supabase
      .from('messages')
      .delete()
      .eq('chat_id', testChatId)

    console.log('Test completed successfully!')
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testMessageSaving() 