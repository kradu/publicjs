

function initializeBookmarklet() {
    const savedState = JSON.parse(sessionStorage.getItem('bookmarkletState') || 'null');
    if (savedState) {
      LT_URL = savedState.LT_URL;
      NEW_CHAT_LINK = savedState.NEW_CHAT_LINK;
      INIT_MESSAGE = savedState.INIT_MESSAGE;
      CURRENT_MANAGER_ID = savedState.CURRENT_MANAGER_ID;
      if (savedState.needsInitialization) {
        initializeNewChat();
      }
      sessionStorage.removeItem('bookmarkletState');
    } else {
      promptForInitialInfo();
    }
  }
  
  function onPageFullyLoaded() {
    setTimeout(() => {
      loadSavedState();
      if (!sessionStorage.getItem('bookmarkletState')) {
        // This is the initial load, not a redirect
        promptForInitialInfo();
      }
    }, 1000); // Wait 1 second after page load
  }
  
  initializeBookmarklet();

function promptForInitialInfo() {
LT_URL = prompt("Please enter the LT_URL:", "");
NEW_CHAT_LINK = prompt("Please enter the new chat link:", "");
INIT_MESSAGE = prompt("Please enter the initialization message:", "");

if (!LT_URL || !NEW_CHAT_LINK || !INIT_MESSAGE) {
alert("All fields are required. Script will not run.");
return;
}

// Start the initial polling or other setup here
createManager(generateRandomId())
.then(data => {
  this.currentManagerId = data.managerId;
  window.startPolling(this.currentManagerId);
})
.catch(error => {
  console.error('Error creating manager:', error);
  alert('An error occurred while creating the manager. Check the console for details.');
});
}

function saveStateBeforeRedirect() {
sessionStorage.setItem('bookmarkletState', JSON.stringify({
  LT_URL,
  NEW_CHAT_LINK,
  INIT_MESSAGE,
  CURRENT_MANAGER_ID,
  needsInitialization: true
}));
}  

function loadSavedState() {
const savedState = sessionStorage.getItem('bookmarkletState');
if (savedState) {
  const state = JSON.parse(savedState);
  LT_URL = state.LT_URL;
  NEW_CHAT_LINK = state.NEW_CHAT_LINK;
  INIT_MESSAGE = state.INIT_MESSAGE;
  this.currentManagerId = state.currentManagerId;
  if (state.needsInitialization) {
    initializeNewChat();
  }
  sessionStorage.removeItem('bookmarkletState');
  return true;
}
return false;
}

async function initializeNewChat() {
await waitForElement('.ProseMirror[contenteditable="true"]', 30000);
await setMessage(await getTextbox(), INIT_MESSAGE);
const sendButton = await getSendButton();
if (sendButton) sendButton.click();
await waitForNewChatUrl();
window.startPolling(CURRENT_MANAGER_ID);
}

  function generateRandomId(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  }

  class SentMessagesStorage {
constructor() {
  this.sentMessages = new Set();
  this.chatCounters = new Map();
}

    clearSentMessages() {
      this.sentMessagesStorage.clear();
    }
  
    addSentMessage(messageId) {
      this.sentMessages.add(messageId);
    }
  
    hasSentMessage(messageId) {
      return this.sentMessages.has(messageId);
    }
  
    clear() {
      this.sentMessages.clear();
    }
incrementChatCounter(chatUrl) {
  const count = (this.chatCounters.get(chatUrl) || 0) + 1;
  this.chatCounters.set(chatUrl, count);
  return count;
}

getChatCounter(chatUrl) {
  return this.chatCounters.get(chatUrl) || 0;
}

  }
    // MessageSender class
    class MessageSender {
      constructor(){
            this.sentMessagesStorage = new SentMessagesStorage();

      }
      async sendMessage(message, currentManagerId) {
        console.log(`in sendMessage and message: ${JSON.stringify(message)}`);
        if (message?.content != null) {
          if (this.sentMessagesStorage.hasSentMessage(message.id)) {
            await apiCall(`/api/set-message-completed/${message.id}/${currentManagerId}`, 'POST', { 
              managerId: currentManagerId, 
              messageId: message.id, 
              status: 'completed'
            });
            console.log(`__in:bookmarklet.js_sendMessage__ ${`Message ${message.id} has already been sent. sending completed response and Skipping.`}`);
            return { success: false, reason: 'already_sent' };
          }
          else{

            console.log(`__in:bookmarklet.js_sendMessage__ ${`Attempting to send message: "${message.content}"`}`);

            try {

                const currentUrl = window.location.href;
const messageCount = this.sentMessagesStorage.incrementChatCounter(currentUrl);

if (messageCount >= 2) {
  await this.handleNewChatUrl();
  return { success: false, reason: 'new_chat_started' };
}
              const textbox = await this.getTextbox();
              if (!textbox) throw new Error("Textbox not found");
      
              await this.setMessage(textbox, message.content);
            const sendButton = await this.getSendButton();
            if (!sendButton) throw new Error("Send button not found");
    
            sendButton.click();
              await this.waitForResponse();
              this.sentMessagesStorage.addSentMessage(message.id);
    
              // Notify the server about successful injection
              await this.notifyServerOfSuccessfulInjection(message.id);
              console.log(`__in:bookmarklet.js_sendMessage__ ${"Message sent successfully"}`);
              return { success: true };
            } catch (error) {
              console.error(`Error sending message: ${error.message}`);
              console.error("Full error object:", error);
              return { success: false, reason: 'error', error: error.message };
            }
          }
        }
        else{
          console.log('message content is empty');
          return {success: false, reason: 'message.content is empty'};
        }
    }
      async notifyServerOfSuccessfulInjection(messageId) {
        try {
          const response = await apiCall(`/api/message-injected/${currentManagerId}/${messageId}`, 'GET');
          console.log(`__in:bookmarklet.js_notifyServerOfSuccessfulInjection__ ${'Server notified of successful injection:', response}`);
          return response;
        } catch (error) {
          console.error('Error notifying server of successful injection:', error);
          throw error;
        }
      }
    
      async getTextbox() {
        return this.waitForElement('.ProseMirror[contenteditable="true"]', 10000);
      }async handleNewChatUrl() {
        window.stopPolling();
        saveStateBeforeRedirect();
        window.location.href = NEW_CHAT_LINK;
        // window.location.href = NEW_CHAT_LINK;
      
        // // Wait for the URL to change
        // await this.waitForUrlChange(originalUrl);
      
        // // Wait for the new chat page to load
        // await this.waitForElement('.ProseMirror[contenteditable="true"]', 30000);
      
        // // Enter the initialization message
        // await this.setMessage(await this.getTextbox(), INIT_MESSAGE);
      
        // // Click the send button
        // const sendButton = await this.getSendButton();
        // if (sendButton) sendButton.click();
      
        // // Wait for the chat to be created and URL to update
        // await this.waitForNewChatUrl();
      
        // // Start polling with the current manager ID
        // window.startPolling(CURRENT_MANAGER_ID);
      }

      async waitForUrlChange(originalUrl, timeout = 30000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
          if (window.location.href !== originalUrl) {
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error("Timeout waiting for URL to change");
      }

async  waitForNewChatUrl() {
const maxWaitTime = 30000; // 30 seconds
const startTime = Date.now();
console.log(`waiting for new chat`)
while (Date.now() - startTime < maxWaitTime) {
  if (window.location.href.includes('/chat/')) {
    this.sentMessagesStorage.chatCounters.set(window.location.href, 0);
    return;
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
}
throw new Error("Timeout waiting for new chat URL");
}
      async setMessage(textbox, message) {
try{
   textbox.innerHTML = '';
        const p = document.createElement('p');
        p.textContent = message;
        textbox.appendChild(p);
        textbox.dispatchEvent(new Event('input', { bubbles: true }));
        
        return true;
      } catch (error) {
        console.error(`Error setting message: ${error.message}`);
        console.error("Full error object:", error);
        return false; 
      }
      }
  
      async getSendButton() {
        const button = await this.waitForElement('button[aria-label="Send Message"]', 10000);
        return button && !button.disabled ? button : null;
      }
  
      async waitForResponse() {
        const maxWaitTime = 300000; // 5 minutes
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
          const stopButton = document.querySelector('button[aria-label="Stop Response"]');
          const regenerateButton = document.querySelector('button[aria-label="Regenerate Response"]');
          const sendButton = document.querySelector('button[aria-label="Send Message"]');
          
          if (!stopButton && (regenerateButton || sendButton)) {
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error("Timeout waiting for Claude to finish responding");
      }
  
      async waitForElement(selector, timeout = 30000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
          const element = document.querySelector(selector);
          if (element) return element;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
      }
    }
  
    const messageSender = new MessageSender();

        const apiCall = (endpoint, method, data = null) => {
          const url = new URL(`${LT_URL}${endpoint}`);
      const options = {
        method: method,
        headers: {
          'bypass-tunnel-reminder': 'true',
          'User-Agent': 'CustomScriptAgent/1.0',
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      };
    
      if (method === 'GET' && data) {
        Object.keys(data).forEach(key => url.searchParams.append(key, data[key]));
        delete options.body;
      }
    
      return fetch(url, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log(`__in:bookmarklet.js_apiCall__ ${'API Response:', JSON.stringify(data)}`);
          return data;
        })
        .catch(error => {
          console.error('API Error:', error);
          throw error;
        });
    };

  // // Function to create a new queue manager
  // window.createManager = (bookmarkletId) => {
  //   return apiCall('/api/managers', 'POST', { bookmarkletId })
  //     .then(data => {
  //       console.log(`__in:bookmarklet.js__ ${'Created manager:', data}`);
  //       return data;
  //     });
  // };

  // // Function to create a new queue
  // window.createQueue = (managerId, queueName) => {
  //   return apiCall('/api/queues', 'POST', { managerId, queueName })
  //     .then(data => {
  //       console.log(`__in:bookmarklet.js__ ${'Created queue:', data}`);
  //       return data;
  //     });
  // };

  // Function to enqueue an item
  window.enqueueItem = (managerId, queueName, item) => {
    return apiCall('/api/enqueue', 'POST', { managerId, queueName, item })
      .then(data => {
        console.log(`__in:bookmarklet.js__ ${'Enqueued item:', data}`);
        return data;
      });
  };

  // Function to get all managers
  window.getAllManagers = () => {
    return apiCall('/api/managers', 'GET')
      .then(data => {
        console.log(`__in:bookmarklet.js__ ${'All managers:', data}`);
        return data;
      });
  };



window.sendMessageToServer = (message) => {
  return apiCall('/api/send-message', 'POST', { message })
    .then(data => {
      console.log(`__in:bookmarklet.js__ ${'Message sent to server:', data}`);
      return data;
    })
    .catch(error => {
      console.error('Error sending message to server:', error);
      throw error;
    });
};

  // New function to test create manager (GET)
  window.testCreateManager = (bookmarkletId) => {
    return apiCall('/api/test/create-manager', 'GET', { id: bookmarkletId })
      .then(data => {
        console.log(`__in:bookmarklet.js__ ${'Test Create Manager:', data}`);
        return data;
      });
  };

  // New function to test create queue (GET)
  window.testCreateQueue = (managerId, queueName) => {
    return apiCall('/api/test/create-queue', 'GET', { managerId, queueName })
      .then(data => {
       console.log(`__in:bookmarklet.js__ ${'Test Create Queue:', data}`);
        return data;
      });
  };

  // New function to test enqueue item (GET)
  window.testEnqueueItem = (managerId, queueName, item) => {
    return apiCall('/api/test/enqueue', 'GET', { managerId, queueName, item })
      .then(data => {
        console.log(`__in:bookmarklet.js__ ${'Test Enqueue Item:', data}`);
        return data;
      });
  };

  //communicating with the server

 // Add this near the top of your script, outside of any functions
let pollInterval = null;
let currentManagerId = null;

// Replace your existing startPolling function with this:
window.startPolling = (managerId) => {
  // Clear any existing interval
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  
  // Set the new manager ID
  currentManagerId = managerId;
  CURRENT_MANAGER_ID = managerId;
  
  // Start the new polling interval
  pollInterval = setInterval(checkForMessages, 10000); // Poll every 10 seconds
  console.log(`__in:bookmarklet.js__ ${`Started polling for manager ${currentManagerId}`}`);
};

// Add this new stopPolling function
window.stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log(`__in:bookmarklet.js__ ${`Stopped polling for manager ${currentManagerId}`}`);
  }
  currentManagerId = null;
};
  // New function to send a message to Claude
  window.sendMessageToChatbot = async (message, managerId) => {
    try {
      const result = await messageSender.sendMessage(message, managerId);
      console.log('Message sent to chatbot:', result);
      return { success: true };
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      return { success: false, error: error.message };
    }
  };

async function checkForMessages() {
  if (!currentManagerId) {
    console.error('No manager ID set for polling');
    return;
  }
  try {
    const response = await apiCall(`/api/check-for-messages/${currentManagerId}`, 'GET');
    if (response.message) {
      console.log('New messages available');
      // If there are new messages, fetch and process them
      await processActiveMessage(response, currentManagerId);
    }
  } catch (error) {
    console.error('Error checking for new messages:', error);
  }
}
  async function processActiveMessage(activeMessage, currentManagerId) {
        console.log(`[DEBUG] activeMessage.message = ${activeMessage.message.content}`)
        
        try{
          const messageSendResponse = await sendMessageToChatbot(activeMessage.message, currentManagerId);
          console.log(`[DEBUG] messageSendResponse = ${JSON.stringify(messageSendResponse)}`)
 
                
        }
        catch(error){
          console.error('Error printing to Claude')
          await apiCall(`/api/set-message-failed/${activeMessage.message.id}`, 'POST', { 
            managerId: currentManagerId, 
            messageId: activeMessage.message.id, 
            status: 'failed'
          });
        }
        
      }


  // Modify createManager to automatically start polling
  window.createManager = (bookmarkletId) => {
    return apiCall('/api/managers', 'POST', {bookmarkletId})
      .then(data => {
        console.log(`__in:bookmarklet.js__ 'Created manager:'${JSON.stringify(data)}`);
        startPolling(data.managerId);
        return data;
      });
  };

  console.log(`__in:bookmarklet.js__ ${'Queue management functions have been added to the window object.'}`);
  alert('Queue management functions are now available. Type commands in the console to use them.');
