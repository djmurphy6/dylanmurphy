// Page content data for the SPA
const pagesData = {
  home: {
    title: "iDylan Murphy",
    menu: [
      { text: "Skills", page: "skills" },
      { text: "Programming Languages", page: "lang" },
      { text: "Projects", page: null }, // Not linked yet
      { text: "LinkedIn", page: "linkedin" },
      { text: "GitHub", page: "github" },
      { text: "Now Playing", page: "nowplaying" }
    ]
  },
  
  skills: {
    title: "iDylan Murphy",
    menu: [
      { text: "Fast Learner", page: "fastlearner" },
      { text: "Problem Solving", page: null },
      { text: "Teamwork", page: "teamwork" },
      { text: "Leadership", page: "leadership" },
      { text: "Coaching", page: "coaching" },
      { text: "Back", page: "home" }
    ]
  },
  
  lang: {
    title: "iDylan Murphy",
    menu: [
      { text: "C", page: null },
      { text: "Java", page: null },
      { text: "Python", page: null },
      { text: "C++", page: null },
      { text: "HTML", page: null },
      { text: "Back", page: "home" }
    ]
  },
  
  about: {
    title: "iDylan Murphy",
    menu: [
      { text: "University of Oregon", page: null },
      { text: "BS Computer Science", page: null },
      { text: "Back", page: "home" }
    ]
  },
  
  linkedin: {
    title: "iDylan Murphy - LinkedIn",
    menu: [
      { text: "Profile", page: null },
      { text: "Connect", page: null },
      { text: "Experience", page: null },
      { text: "Education", page: null },
      { text: "Skills & Endorsements", page: null },
      { text: "Back", page: "home" }
    ]
  },
  
  github: {
    title: "iDylan Murphy - GitHub",
    menu: [
      { text: "Repositories", page: null },
      { text: "Activity", page: null },
      { text: "Followers", page: null },
      { text: "Following", page: null },
      { text: "Stars", page: null },
      { text: "Back", page: "home" }
    ]
  },
  
  nowplaying: {
    title: "iDylan Murphy - Now Playing",
    menu: [
      { text: "Current Song", page: null },
      { text: "Recently Played", page: null },
      { text: "Playlists", page: null },
      { text: "Artists", page: null },
      { text: "Albums", page: null },
      { text: "Back", page: "home" }
    ]
  },
  
  leadership: {
    title: "Leadership - Dylan Murphy",
    menu: [
      { text: "Leading by Example", page: null },
      { text: "Initiative & Direction", page: null },
      { text: "Team Motivation", page: null },
      { text: "Strategic Planning", page: null },
      { text: "Decision Making", page: null },
      { text: "Back", page: "skills" }
    ]
  },
  
  coaching: {
    title: "Coaching - Dylan Murphy",
    menu: [
      { text: "Skill Development", page: null },
      { text: "Performance Enhancement", page: null },
      { text: "Goal Setting", page: null },
      { text: "Feedback & Support", page: null },
      { text: "Mentoring", page: null },
      { text: "Back", page: "skills" }
    ]
  },
  
  fastlearner: {
    title: "Fast Learner - Dylan Murphy",
    menu: [
      { text: "Quick Adaptation", page: null },
      { text: "Knowledge Acquisition", page: null },
      { text: "Skill Mastery", page: null },
      { text: "Continuous Learning", page: null },
      { text: "Technology Adoption", page: null },
      { text: "Back", page: "skills" }
    ]
  },
  
  teamwork: {
    title: "Teamwork - Dylan Murphy",
    menu: [
      { text: "Collaboration", page: null },
      { text: "Communication", page: null },
      { text: "Conflict Resolution", page: null },
      { text: "Shared Goals", page: null },
      { text: "Support & Trust", page: null },
      { text: "Back", page: "skills" }
    ]
  }
};

// Current page state
let currentPage = 'home';

// Function to get current page data
function getCurrentPageData() {
  return pagesData[currentPage] || pagesData.home;
}

// Function to navigate to a page
function navigateToPage(page) {
  if (page && pagesData[page]) {
    currentPage = page;
    updatePageContent();
    
    // Update URL without page reload
    const url = page === 'home' ? '/' : `/#${page}`;
    history.pushState({ page: page }, '', url);
  }
}

// Function to update page content
function updatePageContent() {
  const pageData = getCurrentPageData();
  
  // Update title
  document.title = pageData.title;
  
  // Update header title
  const headerTitle = document.querySelector('.ipod-top-middle h1');
  if (headerTitle) {
    headerTitle.textContent = pageData.title;
  }
  
  // Update menu
  const menuElement = document.querySelector('.menu');
  if (menuElement) {
    menuElement.innerHTML = '';
    
    pageData.menu.forEach((item, index) => {
      const li = document.createElement('li');
      
      if (item.page) {
        li.innerHTML = `<a href="#" data-page="${item.page}" style="color: inherit; text-decoration: none;">${item.text}</a>`;
      } else {
        li.textContent = item.text;
      }
      
      menuElement.appendChild(li);
    });
    
    // Reinitialize menu selection
    initializeMenuSelection();
  }
}

// Initialize page from URL hash
function initializeFromURL() {
  const hash = window.location.hash.substring(1);
  if (hash && pagesData[hash]) {
    currentPage = hash;
  } else {
    currentPage = 'home';
  }
  updatePageContent();
}

// Handle browser back/forward
window.addEventListener('popstate', function(event) {
  if (event.state && event.state.page) {
    currentPage = event.state.page;
    updatePageContent();
  } else {
    currentPage = 'home';
    updatePageContent();
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeFromURL();
  
  // Add click handlers for navigation links
  document.addEventListener('click', function(e) {
    if (e.target.hasAttribute('data-page')) {
      e.preventDefault();
      const page = e.target.getAttribute('data-page');
      navigateToPage(page);
    }
  });
});
