// Scroll animations
const cards = document.querySelectorAll('.card');
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

cards.forEach(card => { // Create an observer for every card
    observer.observe(card);
});

// Smooth scroll navigation from internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Create particles for .hero section (my name was looking lonely)
function createParticles() {
    const container = document.querySelector('.particles');
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Randomize properties
        const size = Math.random() * 4 + 5;
        const left = Math.random() * 100;
        const delay = Math.random() * -20;
        const duration = Math.random() * 10 + 15;
        
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
        `;
        
        container.appendChild(particle);
    }
}

// Get modal elements
const modal = document.getElementById('card-modal');
const modalContent = modal.querySelector('.modal-body');
const modalClose = modal.querySelector('.modal-close');

function openModal(card) {
    // Clone the card content into the modal
    modalContent.innerHTML = card.innerHTML;
    
    // Create a button element for the unique link
    const linkButton = document.createElement('a');
    
    // Read the unique link and button text from data attributes
    const linkUrl = card.getAttribute('data-link-url') || "default-page.html";
    const linkText = card.getAttribute('data-link-text') || "Learn More";
    
    // Set up the link button
    linkButton.href = linkUrl;
    linkButton.textContent = linkText;
    linkButton.className = "modal-link-button";
    
    // Open external links in a new tab
    if (linkUrl.startsWith('http')) {
        linkButton.target = "_blank";
    }
    
    // Append the link button at the bottom of the modal content
    modalContent.appendChild(linkButton);
    
    // Display the modal
    modal.classList.add('active');
}

// Function to close modal
function closeModal() {
  modal.classList.remove('active');
  modalContent.innerHTML = '';
}

// Only select cards that are meant to be expandable
const expandableCards = document.querySelectorAll('.card[data-expandable="true"]');
expandableCards.forEach(card => {
  card.addEventListener('click', () => {
    openModal(card);
  });
});

// Close modal when clicking on the close button
modalClose.addEventListener('click', closeModal);

// Also close modal if clicking outside the modal content
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

createParticles();