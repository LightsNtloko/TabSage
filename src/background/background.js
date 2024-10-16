chrome.runtime.onInstalled.addListener(() => {
    console.log('TabSage installed.');
    generateRecommendations();
    setInterval(generateRecommendations, 60 * 60 * 1000);
});

chrome.runtime.onStartup.addListener(() => {
    console.log('TabSage service worker started.');
    generateRecommendations();
});

function generateRecommendations() {
    if (chrome.history) {
        chrome.history.search({ text: '', maxResults: 100 }, (historyItems) => {
            const userProfile = analyzeHistory(historyItems);
            const recommendations = fetchRecommendations(userProfile);
            console.log('Generated Recommendations:', recommendations);
        });
    } else {
        console.error('chrome.history is not available.');
    }
}

function analyzeHistory(historyItems) {
    const profile = {
        categories: {}
    };

    historyItems.forEach(item => {
        const url = new URL(item.url);
        const domain = url.hostname.replace('www.', '').split('.')[0];

        if (!profile.categories[domain]) {
            profile.categories[domain] = 0;
        }
        profile.categories[domain]++;
    });

    let userType = 'normal';
    const sortedCategories = Object.entries(profile.categories).sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0][0];
        if (['edu', 'research', 'journal', 'music'].some(keyword => topCategory.includes(keyword))) {
            userType = 'researcher';
        } else if (['business', 'finance', 'market'].some(keyword => topCategory.includes(keyword))) {
            userType = 'business';
        }
    }

    profile.userType = userType;
    return profile;
}

function fetchRecommendations(profile) {
    const staticRecommendations = {
        researcher: [
            { title: 'Google Scholar', url: 'https://scholar.google.com/' },
            { title: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' },
            { title: 'IEEE Xplore', url: 'https://ieeexplore.ieee.org/' }
        ],
        business: [
            { title: 'LinkedIn', url: 'https://www.linkedin.com/' },
            { title: 'Bloomberg', url: 'https://www.bloomberg.com/' },
            { title: 'Harvard Business Review', url: 'https://hbr.org/' }
        ],
        normal: [
            { title: 'Reddit', url: 'https://www.reddit.com/' },
            { title: 'YouTube', url: 'https://www.youtube.com/' },
            { title: 'Medium', url: 'https://medium.com/' }
        ]
    };

    return staticRecommendations[profile.userType] || staticRecommendations['normal'];
}
