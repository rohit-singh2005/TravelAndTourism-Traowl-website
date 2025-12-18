// Load about us content from API
async function loadAboutContent() {
  try {
    const response = await fetch('/api/about-us');
    if (!response.ok) {
      throw new Error('Failed to load about content');
    }
    
    const data = await response.json();
    const aboutData = data.aboutUs;
    
    // Update hero section
    const heroTitle = document.querySelector('.about-hero-content h1');
    if (heroTitle && aboutData.heroSection) {
      heroTitle.textContent = aboutData.heroSection.title || 'About Us';
    }
    
    // Update sections
    updateAboutSection('who', aboutData.story);
    updateAboutSection('mission', aboutData.mission);
    
    // Update team section if it exists
    if (aboutData.team && aboutData.team.length > 0) {
      updateTeamSection(aboutData.team);
    }
    
    console.log('✅ About content loaded successfully');
  } catch (error) {
    console.error('❌ Error loading about content:', error);
  }
}

function updateAboutSection(sectionId, sectionData) {
  const section = document.getElementById(sectionId);
  if (!section || !sectionData) return;
  
  const title = section.querySelector('h2');
  const paragraphs = section.querySelectorAll('p');
  
  if (title && sectionData.title) {
    title.childNodes[0].textContent = sectionData.title + ' ';
  }
  
  if (paragraphs.length > 0 && sectionData.description) {
    paragraphs[0].textContent = sectionData.description;
  }
}

function updateTeamSection(teamData) {
  const teamSection = document.querySelector('.about-pillars');
  if (!teamSection) return;
  
  const teamTitle = teamSection.querySelector('h2');
  if (teamTitle) {
    teamTitle.childNodes[0].textContent = 'Meet The Team ';
  }
  
  // Update team member cards if they exist
  const teamCards = teamSection.querySelectorAll('.pillar-card');
  teamCards.forEach((card, index) => {
    if (teamData[index]) {
      const member = teamData[index];
      const nameElement = card.querySelector('h3');
      const roleElement = card.querySelector('.pillar-role');
      const descElement = card.querySelector('p:not(.pillar-role)');
      const imgElement = card.querySelector('img');
      
      if (nameElement) nameElement.textContent = member.name;
      if (roleElement) roleElement.textContent = member.position;
      if (descElement) descElement.textContent = member.description;
      if (imgElement && member.image) imgElement.src = member.image;
    }
  });
}

// Load content when page loads
document.addEventListener('DOMContentLoaded', loadAboutContent);

document.querySelectorAll('.about-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.about-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    // If you add more sections, show/hide them here
    // Example: document.querySelectorAll('.about-section').forEach(s => s.style.display = 'none');
    // document.getElementById(this.dataset.tab).style.display = 'block';
  });
});

// Modal functionality
const modal = document.getElementById('authModal');
const signInBtn = document.getElementById('signInBtn');
const modalClose = document.getElementById('modalClose');

// Open modal
signInBtn.addEventListener('click', () => {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
});

// Close modal
modalClose.addEventListener('click', () => {
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});