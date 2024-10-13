document.addEventListener('DOMContentLoaded', () => {
  loadRecommendations();
  loadLibrary();
  setupChatbot();
});

// Load Recommended Tabs
function loadRecommendations() {
  chrome.storage.local.get(['recommendations'], (result) => {
    const recommendations = result.recommendations || [];
    const list = document.getElementById('recommendation-list');
    list.innerHTML = '';

    recommendations.forEach((rec, index) => {
      const div = document.createElement('div');
      div.className = 'tab-item';
      div.innerHTML = `
        <a href="${rec.url}" target="_blank">${rec.title}</a>
        <div>
          <button data-index="${index}" class="like-btn">👍</button>
          <button data-index="${index}" class="dislike-btn">👎</button>
          <button data-index="${index}" class="visit-later-btn">⏳</button>
        </div>
      `;
      list.appendChild(div);
    });

    // Add event listeners for buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => likeRecommendation(btn.dataset.index));
    });
    document.querySelectorAll('.dislike-btn').forEach(btn => {
      btn.addEventListener('click', () => dislikeRecommendation(btn.dataset.index));
    });
    document.querySelectorAll('.visit-later-btn').forEach(btn => {
      btn.addEventListener('click', () => visitLaterRecommendation(btn.dataset.index));
    });
  });
}

// Like a Recommendation
function likeRecommendation(index) {
  chrome.storage.local.get(['recommendations', 'library'], (result) => {
    const recommendations = result.recommendations || [];
    const library = result.library || [];
    if (recommendations[index]) {
      library.push(recommendations[index]);
      chrome.storage.local.set({ library }, () => {
        loadLibrary();
        recommendations.splice(index, 1);
        chrome.storage.local.set({ recommendations }, loadRecommendations);
      });
    }
  });
}

// Dislike a Recommendation
function dislikeRecommendation(index) {
  chrome.storage.local.get(['recommendations'], (result) => {
    const recommendations = result.recommendations || [];
    if (recommendations[index]) {
      recommendations.splice(index, 1);
      chrome.storage.local.set({ recommendations }, loadRecommendations);
    }
  });
}

// Visit Later Recommendation
function visitLaterRecommendation(index) {
  chrome.storage.local.get(['recommendations'], (result) => {
    const recommendations = result.recommendations || [];
    if (recommendations[index]) {
      // Optionally implement 'visit later' functionality
      // For simplicity, we'll treat it similar to 'like'
      window.open(recommendations[index].url, '_blank');
      dislikeRecommendation(index);
    }
  });
}

// Load Library
function loadLibrary() {
  chrome.storage.local.get(['library'], (result) => {
    const library = result.library || [];
    const list = document.getElementById('library-list');
    list.innerHTML = '';

    library.forEach((tab, index) => {
      const div = document.createElement('div');
      div.className = 'tab-item';
      div.innerHTML = `
        <a href="${tab.url}" target="_blank">${tab.title}</a>
        <button data-index="${index}" class="remove-btn">❌</button>
      `;
      list.appendChild(div);
    });

    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => removeFromLibrary(btn.dataset.index));
    });
  });
}

// Remove from Library
function removeFromLibrary(index) {
  chrome.storage.local.get(['library'], (result) => {
    const library = result.library || [];
    if (library[index]) {
      library.splice(index, 1);
      chrome.storage.local.set({ library }, loadLibrary);
    }
  });
}

// Setup Chatbot
function setupChatbot() {
  const sendBtn = document.getElementById('send-chat');
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');

  sendBtn.addEventListener('click', () => {
    const query = input.value.trim();
    if (query === '') return;

    // Display user message
    const userMsg = document.createElement('div');
    userMsg.textContent = `You: ${query}`;
    messages.appendChild(userMsg);
    input.value = '';

    // Get chatbot response (using OpenAI API as an example)
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_OPENAI_API_KEY' // Replace with your API key
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: query }]
      })
    })
    .then(response => response.json())
    .then(data => {
      const botMsg = document.createElement('div');
      botMsg.textContent = `Sage: ${data.choices[0].message.content}`;
      messages.appendChild(botMsg);
      messages.scrollTop = messages.scrollHeight;
    })
    .catch(error => {
      console.error('Error:', error);
      const errorMsg = document.createElement('div');
      errorMsg.textContent = 'Sage: Sorry, something went wrong.';
      messages.appendChild(errorMsg);
    });
  });
}
