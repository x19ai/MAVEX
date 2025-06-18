// Test local storage functionality
const { writeToIndexedDB, readFromIndexedDB } = require('./lib/chat-store/persist')

async function testLocalStorage() {
  const testChatId = 'test-chat-' + Date.now()
  const testMessage = {
    id: 'test-message-1',
    role: 'assistant',
    content: 'This is a test assistant message',
    createdAt: new Date()
  }

  console.log('Testing local storage...')
  
  try {
    // Test writing
    await writeToIndexedDB("messages", { 
      id: testChatId, 
      messages: [testMessage] 
    })
    console.log('Message written to local storage')

    // Test reading
    const result = await readFromIndexedDB("messages", testChatId)
    console.log('Message read from local storage:', result)

    if (result && result.messages && result.messages.length > 0) {
      console.log('✅ Local storage test passed!')
    } else {
      console.log('❌ Local storage test failed - no messages found')
    }
  } catch (error) {
    console.error('❌ Local storage test failed:', error)
  }
}

testLocalStorage() 