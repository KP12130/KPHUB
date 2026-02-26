const { db, admin } = require('../config/firebase');

/**
 * Records daily analytics for a creator.
 * @param {string} authorUid - The UID of the creator.
 * @param {'views' | 'revenue'} metric - The metric type.
 * @param {number} value - The value to add.
 */
async function recordProjectAnalytics(authorUid, metric, value = 1) {
    if (!authorUid) return;
    try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const monthStr = dateStr.substring(0, 7); // YYYY-MM
        const dayName = today.toLocaleDateString('default', { month: 'short', day: 'numeric' });

        const analyticsRef = db.collection('analytics').doc(`${authorUid}_${monthStr}`);
        const doc = await analyticsRef.get();

        if (!doc.exists) {
            await analyticsRef.set({
                uid: authorUid,
                month: monthStr,
                history: [
                    { name: dayName, views: metric === 'views' ? value : 0, revenue: metric === 'revenue' ? value : 0 }
                ],
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const data = doc.data();
            let history = data.history || [];
            const dayEntry = history.find(h => h.name === dayName);

            if (dayEntry) {
                dayEntry[metric] = (dayEntry[metric] || 0) + (metric === 'revenue' ? Number(value) : value);
            } else {
                history.push({
                    name: dayName,
                    views: metric === 'views' ? value : 0,
                    revenue: metric === 'revenue' ? value : 0
                });
                if (history.length > 31) history.shift();
            }

            await analyticsRef.update({
                history,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (err) {
        console.error('[ANALYTICS_COLLECT] Failed:', err);
    }
}

module.exports = { recordProjectAnalytics };
