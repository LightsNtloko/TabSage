// Import necessary functions for Chrome API and NLP processing
import { getSearchHistory, storeKeywords, getRecommendations } from './storageHandler.js';

// Function to extract keywords from a URL
async function extractKeywordsFromUrl(url) {
  try {
    const response = await fetch(url);
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Extract meta keywords or use headings for keyword extraction
    const metaKeywords = doc.querySelector('meta[name="keywords"]');
    let keywords = [];
    if (metaKeywords) {
      keywords = metaKeywords.content.split(',');
    } else {
      // Fallback: Extract top keywords from headings
      const headings = doc.querySelectorAll('h1, h2, h3');
      keywords = Array.from(headings).map(heading => heading.textContent.trim());
    }

    return keywords;
  } catch (err) {
    console.error('Error extracting keywords:', err);
    return [];
  }
}

// Function to process search history and generate recommendations
async function processHistoryAndRecommend() {
  const historyItems = await getSearchHistory(); // Custom function to get user's history
  let allKeywords = [];

  for (const item of historyItems) {
    const keywords = await extractKeywordsFromUrl(item.url);
    storeKeywords(item.url, keywords); // Store the keywords for future use
    allKeywords.push(...keywords);
  }

  // Deduplicate keywords
  const uniqueKeywords = [...new Set(allKeywords)];

  // Generate recommendations based on the extracted keywords
  const recommendations = await getRecommendations(uniqueKeywords);

  return recommendations;
}

// Function to get recommendations from stored keywords
async function getRecommendations(keywords) {
  // Example external recommendation API
  const apiEndpoint = 'https://example.com/recommendation';
  const response = await fetch(`${apiEndpoint}?keywords=${encodeURIComponent(keywords.join(','))}`);
  const data = await response.json();
  
  return data.recommendations; // Return list of recommended articles/websites
}

// Function to display recommendations to the user
async function displayRecommendations() {
  const recommendations = await processHistoryAndRecommend();
  
  recommendations.forEach(recommendation => {
    console.log('Recommended:', recommendation.title, recommendation.url);
    // Here you can implement UI logic to display these recommendations in the extension popup
  });
}

// Start the recommendation process (this can be triggered in the background or when the user opens the popup)
displayRecommendations();
