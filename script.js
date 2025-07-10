/*
 * Site-Opener Webapp - Main JavaScript File
 * Version: 2.0 (Ready for Extension Integration)
 *
 * This file manages the webapp's interface, data storage for sites,
 * and prepares the system for interacting with a companion browser extension.
 * It includes logic for managing a list of sites and a list of visited links
 * with a 48-hour expiry policy.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------------
    // 1. DOM ELEMENT REFERENCES
    // ----------------------------------------------------------------
    // Yahan hum HTML ke sabhi zaroori elements ko select kar rahe hain.
    const addSiteBtn = document.getElementById('addSiteBtn');
    const newSiteNameInput = document.getElementById('newSiteName');
    const newSiteUrlInput = document.getElementById('newSiteUrl');
    const sitesDropdown = document.getElementById('sitesDropdown');
    const editSiteBtn = document.getElementById('editSiteBtn');
    const deleteSiteBtn = document.getElementById('deleteSiteBtn');
    const dateSelector = document.getElementById('dateSelector');
    const refreshBtn = document.getElementById('refreshBtn');
    const siteFrame = document.getElementById('siteFrame');
    const iframePlaceholder = document.getElementById('iframe-placeholder');

    // ----------------------------------------------------------------
    // 2. LOCAL STORAGE KEYS
    // ----------------------------------------------------------------
    // Hum data ko save karne ke liye unique keys ka istemal karenge.
    const SITES_STORAGE_KEY = 'siteOpener_sites';
    const VISITED_LINKS_STORAGE_KEY = 'siteOpener_visitedLinks';


    // ----------------------------------------------------------------
    // 3. CORE LOGIC & FUNCTIONS
    // ----------------------------------------------------------------

    /**
     * LocalStorage se data laata hai.
     * @param {string} key - LocalStorage ki key.
     * @returns {Array} - Data ya khaali array.
     */
    function getDataFromStorage(key) {
        const storedData = localStorage.getItem(key);
        try {
            // Agar data hai to use JSON se object/array mein badlo, nahi to khaali array do.
            return storedData ? JSON.parse(storedData) : [];
        } catch (error) {
            console.error(`Error parsing data from localStorage for key "${key}":`, error);
            return []; // Error hone par bhi khaali array return karo.
        }
    }

    /**
     * LocalStorage mein data save karta hai.
     * @param {string} key - LocalStorage ki key.
     * @param {Array} data - Save karne wala data.
     */
    function saveDataToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    /**
     * Jodi hui sites ko dropdown menu mein dikhata hai.
     */
    function populateSitesDropdown() {
        const sites = getDataFromStorage(SITES_STORAGE_KEY);
        sitesDropdown.innerHTML = '<option value="">-- Site Chunein --</option>'; // Pehle dropdown saaf karo.

        sites.forEach((site, index) => {
            const option = document.createElement('option');
            option.value = site.url;
            option.textContent = site.name;
            option.dataset.index = index; // Index ko option mein store karo, delete/edit ke liye.
            sitesDropdown.appendChild(option);
        });
    }

    /**
     * Dropdown se chuni hui site ko iframe mein load karta hai.
     */
    function loadSelectedSiteInIframe() {
        const selectedUrl = sitesDropdown.value;
        if (selectedUrl) {
            siteFrame.src = selectedUrl;
            siteFrame.style.display = 'block';
            iframePlaceholder.style.display = 'none';
        } else {
            // Agar koi site nahi chuni hai to placeholder dikhao.
            siteFrame.src = 'about:blank';
            siteFrame.style.display = 'none';
            iframePlaceholder.style.display = 'flex';
        }
    }

    /**
     * Nayee site ko list mein jodta hai.
     */
    function handleAddSite() {
        const name = newSiteNameInput.value.trim();
        let url = newSiteUrlInput.value.trim();

        if (!name || !url) {
            alert('Kripya site ka naam aur URL, dono daalein.');
            return;
        }

        // Agar URL mein http:// ya https:// nahi hai, to use jod do.
        if (!url.match(/^https?:\/\//)) {
            url = 'https://' + url;
        }

        const sites = getDataFromStorage(SITES_STORAGE_KEY);
        // Check karo ki kahin ye site pehle se to nahi hai.
        const isDuplicate = sites.some(site => site.url === url || site.name === name);
        if (isDuplicate) {
            alert('Yeh site pehle se hi list mein hai.');
            return;
        }
        
        sites.push({ name, url });
        saveDataToStorage(SITES_STORAGE_KEY, sites);
        
        populateSitesDropdown();

        // Input fields ko khaali kar do.
        newSiteNameInput.value = '';
        newSiteUrlInput.value = '';

        alert(`Site "${name}" safaltapoorvak jod di gayi hai!`);
    }

    /**
     * Chuni hui site ko list se delete karta hai.
     */
    function handleDeleteSite() {
        const selectedOption = sitesDropdown.options[sitesDropdown.selectedIndex];
        // Check karo ki user ne koi site chuni hai ya nahi.
        if (!selectedOption || !selectedOption.dataset.index) {
            alert('Delete karne ke liye pehle list se ek site chunein.');
            return;
        }

        const siteIndex = parseInt(selectedOption.dataset.index, 10);
        const sites = getDataFromStorage(SITES_STORAGE_KEY);
        const siteToDelete = sites[siteIndex];

        // User se confirmation lo.
        if (confirm(`Kya aap vakai "${siteToDelete.name}" ko list se hatana chahte hain?`)) {
            sites.splice(siteIndex, 1); // Array se site ko hatao.
            saveDataToStorage(SITES_STORAGE_KEY, sites);
            populateSitesDropdown();
            loadSelectedSiteInIframe(); // Iframe ko reset karo.
        }
    }
    
    /**
     * Chuni hui site ka naam ya URL edit karta hai.
     */
    function handleEditSite() {
        const selectedOption = sitesDropdown.options[sitesDropdown.selectedIndex];
        if (!selectedOption || !selectedOption.dataset.index) {
            alert('Edit karne ke liye pehle list se ek site chunein.');
            return;
        }
        
        const siteIndex = parseInt(selectedOption.dataset.index, 10);
        const sites = getDataFromStorage(SITES_STORAGE_KEY);
        const currentSite = sites[siteIndex];

        const newName = prompt('Site ka naya naam daalein:', currentSite.name);
        // Agar user ne cancel nahi kiya to hi aage badho.
        if (newName === null) return; 

        const newUrl = prompt('Site ka naya URL daalein:', currentSite.url);
        if (newUrl === null) return;

        if (newName.trim() && newUrl.trim()) {
            sites[siteIndex] = { name: newName.trim(), url: newUrl.trim() };
            saveDataToStorage(SITES_STORAGE_KEY, sites);
            populateSitesDropdown();
            // Edit ki hui item ko re-select karo.
            sitesDropdown.selectedIndex = siteIndex + 1;
            loadSelectedSiteInIframe();
        } else {
            alert("Naam ya URL khaali nahi ho sakta.");
        }
    }

    /**
     * Iframe mein load hui website ko refresh karta hai.
     */
    function handleRefreshIframe() {
        // Sirf tabhi refresh karo jab koi site load ho.
        if (siteFrame.src && siteFrame.src !== 'about:blank') {
            try {
                siteFrame.contentWindow.location.reload();
            } catch (error) {
                // Cross-origin error ho sakta hai, isliye src ko re-assign karna better hai.
                console.warn("Could not reload directly due to cross-origin policy. Re-setting src.");
                siteFrame.src = siteFrame.src;
            }
        } else {
            alert('Koi site load nahi hai jise refresh kiya ja sake.');
        }
    }
    
    /**
     * Date input mein aaj ki date set karta hai.
     */
    function setDefaultDate() {
        const today = new Date();
        // Date ko YYYY-MM-DD format mein badlo.
        dateSelector.value = today.toISOString().split('T')[0];
    }
    
    /**
     * Visited links ki list se 48 ghante se purane links ko saaf karta hai.
     */
    function cleanupExpiredVisitedLinks() {
        const visitedLinks = getDataFromStorage(VISITED_LINKS_STORAGE_KEY);
        if (visitedLinks.length === 0) return; // Agar list khaali hai to kuch na karo.

        const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
        const now = Date.now();
        
        // Sirf un links ko rakho jo 48 ghante ke andar visit hue hain.
        const freshLinks = visitedLinks.filter(link => (now - link.visitedAt) < fortyEightHoursInMs);

        // Agar kuch links hataye gaye hain, to localStorage ko update karo.
        if (freshLinks.length < visitedLinks.length) {
            console.log(`${visitedLinks.length - freshLinks.length} purane visited links hataye gaye.`);
            saveDataToStorage(VISITED_LINKS_STORAGE_KEY, freshLinks);
        }
    }


    // ----------------------------------------------------------------
    // 4. EVENT LISTENERS
    // ----------------------------------------------------------------
    // Yahan hum buttons aur inputs ke click/change events ko handle karte hain.
    addSiteBtn.addEventListener('click', handleAddSite);
    sitesDropdown.addEventListener('change', loadSelectedSiteInIframe);
    deleteSiteBtn.addEventListener('click', handleDeleteSite);
    editSiteBtn.addEventListener('click', handleEditSite);
    refreshBtn.addEventListener('click', handleRefreshIframe);

    // ----------------------------------------------------------------
    // 5. INITIALIZATION
    // ----------------------------------------------------------------
    // Jab page load hota hai, to yeh function sabse pehle chalta hai.
    function initializeApp() {
        console.log("Site-Opener App initializing...");
        
        // Step 1: Purane visited links ko saaf karo.
        cleanupExpiredVisitedLinks();
        
        // Step 2: Sites ki list ko dropdown mein daalo.
        populateSitesDropdown();
        
        // Step 3: Date input mein aaj ki date set karo.
        setDefaultDate();

        console.log("App initialized successfully.");
    }

    // App ko shuru karo!
    initializeApp();
});
