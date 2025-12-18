window.addEventListener('DOMContentLoaded', function() {
  if (typeof CommonComponents !== 'undefined') {
    (new CommonComponents()).addModalHTML();
  }
});

document.addEventListener('DOMContentLoaded', async function() {
    const grid = document.getElementById('activitiesGrid');
    const searchInput = document.getElementById('activitySearch');
    
    console.log('Grid element found:', grid);
    console.log('Search input found:', searchInput);

    if (!grid) {
        console.error('Activities grid element not found!');
        return;
    }

    // Load activities from API
    async function loadActivitiesFromAPI() {
        try {
            const activities = await loadActivitiesPage();
            return activities;
        } catch (error) {
            console.error('Failed to load activities:', error);
            // Fallback to sample data if API fails
            return [
                {
                    name: 'River Rafting',
                    image: 'images/adventure1.webp',
                    description: 'Thrilling river rafting experience through scenic rapids.'
                },
                {
                    name: 'Mountain Trekking',
                    image: 'images/adventure2.webp',
                    description: 'Challenging mountain treks with breathtaking views.'
                },
                {
                    name: 'Rock Climbing',
                    image: 'images/adventure3.webp',
                    description: 'Exciting rock climbing adventures for all skill levels.'
                },
                {
                    name: 'Paragliding',
                    image: 'images/adventure4.webp',
                    description: 'Soar through the skies with professional paragliding.'
                },
                {
                    name: 'Scuba Diving',
                    image: 'images/adventure5.webp',
                    description: 'Explore underwater worlds with guided scuba diving.'
                },
                {
                    name: 'Bungee Jumping',
                    image: 'images/adventure6.webp',
                    description: 'Experience the ultimate adrenaline rush with bungee jumping.'
                }
            ];
        }
    }

    async function displayActivities() {
        console.log('DisplayActivities called');
        const searchValue = searchInput.value.toLowerCase();
        grid.innerHTML = ''; // Clear existing grid
        
        try {
            const activities = await loadActivitiesFromAPI();
            console.log('Activities loaded:', activities);
            const filteredActivities = activities.filter(activity => 
                activity.name.toLowerCase().includes(searchValue)
            );
            console.log('Filtered activities:', filteredActivities);

            if (filteredActivities.length === 0) {
                grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; font-size: 1.2em;">No activities found matching your search.</p>';
                return;
            }

            filteredActivities.forEach(activity => {
                // Create activity card HTML directly
                const encodedImageUrl = activity.image ? encodeURI(activity.image) : 'images/adventure1.webp';
                const activityCard = `
                    <a href="activity-detail.html?activity=${encodeURIComponent(activity.name)}" class="activity-category-card">
                        <img src="${encodedImageUrl}" alt="${activity.name}" class="activity-category-card-img">
                        <div class="activity-category-card-overlay"></div>
                        <h3 class="activity-category-card-title">${activity.name}</h3>
                    </a>
                `;
                grid.insertAdjacentHTML('beforeend', activityCard);
            });
        } catch (error) {
            console.error('Error displaying activities:', error);
            grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; font-size: 1.2em;">Failed to load activities. Please try again later.</p>';
        }
    }

    // Add event listener to the search input
    searchInput.addEventListener('input', displayActivities);

    // Initial display of all activities
    await displayActivities();
});