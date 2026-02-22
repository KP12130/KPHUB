// Utility for Achievement Badges
const BADGES = {
    HELLO_WORLD: { id: 'HELLO_WORLD', name: 'Hello World', icon: '🚀', description: 'Uploaded your first project.' },
    ACTIVE_CODER: { id: 'ACTIVE_CODER', name: 'Active Coder', icon: '💻', description: 'Uploaded 5+ projects.' },
    TOP_ARCHITECT: { id: 'TOP_ARCHITECT', name: 'Top Architect', icon: '🏗️', description: 'Published 10+ stable systems.' },
    POPULAR: { id: 'POPULAR', name: 'Popular', icon: '❤️', description: 'Received 10+ pulses.' },
    VANGUARD: { id: 'VANGUARD', name: 'Vanguard', icon: '⚡', description: 'Accumulated 50,000+ KPC.' },
    ELITE: { id: 'ELITE', name: 'Elite Architect', icon: '🏆', description: 'Accumulated 250,000+ KPC.' },
    BUG_HUNTER: { id: 'BUG_HUNTER', name: 'Bug Hunter', icon: '🐛', description: 'Left 20+ feedback reports (comments).' },
    SOCIALITE: { id: 'SOCIALITE', name: 'Socialite', icon: '💬', description: 'Posted 5+ comments on the grid.' },
    COLLECTOR: { id: 'COLLECTOR', name: 'Collector', icon: '💎', description: 'Liked 10+ projects.' },
    BENEFACTOR: { id: 'BENEFACTOR', name: 'Benefactor', icon: '🌟', description: 'Involved in the donation ecosystem.' },
    VETERAN: { id: 'VETERAN', name: 'Veteran', icon: '🛡️', description: 'Member of the grid for over 30 days.' },
    KIND_SOUL: { id: 'KIND_SOUL', name: 'Kind Soul', icon: '🤍', description: 'Donated 1,000+ KPC to fellow architects.' },
    GRID_BENEFACTOR: { id: 'GRID_BENEFACTOR', name: 'Grid Benefactor', icon: '💎', description: 'Donated 10,000+ KPC to support the grid.' },
    OVERLORD_PATRON: { id: 'OVERLORD_PATRON', name: 'Overlord Patron', icon: '👑', description: 'Donated 100,000+ KPC. A true pillar of the hub.' },
    PHILANTHROPIST: { id: 'PHILANTHROPIST', name: 'Philanthropist', icon: '🎁', description: 'Gifted 10,000+ KPC in system ranks.' },
    PATRON_OF_THE_ARTS: { id: 'PATRON_OF_THE_ARTS', name: 'Patron of the Grid', icon: '🕊️', description: 'Gifted 50,000+ KPC in high-tier memberships.' },
    VOICE_OF_THE_GRID: { id: 'VOICE_OF_THE_GRID', name: 'Voice of the Grid', icon: '📢', description: 'Conducted a global grid broadcast.' }
};

const checkAchievements = (userData) => {
    const badges = userData.badges || [];
    const newBadges = [];
    const stats = userData.stats || {};

    if (!badges.includes('HELLO_WORLD') && stats.uploads >= 1) {
        newBadges.push('HELLO_WORLD');
    }
    if (!badges.includes('ACTIVE_CODER') && stats.uploads >= 5) {
        newBadges.push('ACTIVE_CODER');
    }
    if (!badges.includes('TOP_ARCHITECT') && stats.uploads >= 10) {
        newBadges.push('TOP_ARCHITECT');
    }
    if (!badges.includes('POPULAR') && stats.likesReceived >= 10) {
        newBadges.push('POPULAR');
    }
    if (!badges.includes('VANGUARD') && stats.kpcBalance >= 50000) {
        newBadges.push('VANGUARD');
    }
    if (!badges.includes('ELITE') && stats.kpcBalance >= 250000) {
        newBadges.push('ELITE');
    }
    if (!badges.includes('BUG_HUNTER') && stats.commentsMade >= 20) {
        newBadges.push('BUG_HUNTER');
    }
    if (!badges.includes('SOCIALITE') && stats.commentsMade >= 5) {
        newBadges.push('SOCIALITE');
    }
    if (!badges.includes('COLLECTOR') && (userData.likesGiven || []).length >= 10) {
        newBadges.push('COLLECTOR');
    }
    if (!badges.includes('BENEFACTOR') && ((userData.supporters || []).length > 0 || stats.balance > 0)) {
        newBadges.push('BENEFACTOR');
    }

    // Benevolence Trophies
    const totalDonated = stats.totalDonated || 0;
    if (!badges.includes('KIND_SOUL') && totalDonated >= 1000) {
        newBadges.push('KIND_SOUL');
    }
    if (!badges.includes('GRID_BENEFACTOR') && totalDonated >= 10000) {
        newBadges.push('GRID_BENEFACTOR');
    }
    if (!badges.includes('OVERLORD_PATRON') && totalDonated >= 100000) {
        newBadges.push('OVERLORD_PATRON');
    }

    // Gifting Trophies
    const totalGifted = stats.totalGifted || 0;
    if (!badges.includes('PHILANTHROPIST') && totalGifted >= 10000) {
        newBadges.push('PHILANTHROPIST');
    }
    if (!badges.includes('PATRON_OF_THE_ARTS') && totalGifted >= 50000) {
        newBadges.push('PATRON_OF_THE_ARTS');
    }

    // Broadcast Trophy
    if (!badges.includes('VOICE_OF_THE_GRID') && stats.broadcastsCount >= 1) {
        newBadges.push('VOICE_OF_THE_GRID');
    }

    // Veteran Check
    if (!badges.includes('VETERAN') && userData.createdAt) {
        const createdDate = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
        const daysOld = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
        if (daysOld >= 30) {
            newBadges.push('VETERAN');
        }
    }

    return newBadges;
};

module.exports = { BADGES, checkAchievements };
