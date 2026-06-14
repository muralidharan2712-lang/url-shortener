const Link = require('../models/Link');
const Visit = require('../models/Visit');
const {
  isLinkExpired,
  computeHealthScore,
  getHealthBadge,
  buildShortUrl,
} = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * GET /api/analytics/:id
 * Get detailed analytics for a specific link
 */
const getLinkAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    // Find link (user-scoped)
    const link = await Link.findOne({ _id: id, userId: req.userId });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found.' });
    }

    // Date range for analytics
    const daysNum = Math.min(365, Math.max(1, parseInt(days) || 30));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Fetch all visits for this link within date range
    const visits = await Visit.find({
      linkId: id,
      visitedAt: { $gte: startDate },
    })
      .sort({ visitedAt: -1 })
      .lean();

    // Total visits all-time
    const totalVisits = await Visit.countDocuments({ linkId: id });

    // --- Daily Click Trends ---
    const dailyMap = {};
    // Initialize all days in range to 0
    for (let i = 0; i < daysNum; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    visits.forEach((v) => {
      const key = new Date(v.visitedAt).toISOString().split('T')[0];
      if (dailyMap[key] !== undefined) {
        dailyMap[key]++;
      }
    });
    const dailyTrends = Object.entries(dailyMap)
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Weekly Click Trends (last 12 weeks) ---
    const weeklyMap = {};
    visits.forEach((v) => {
      const d = new Date(v.visitedAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // Sunday
      const key = weekStart.toISOString().split('T')[0];
      weeklyMap[key] = (weeklyMap[key] || 0) + 1;
    });
    const weeklyTrends = Object.entries(weeklyMap)
      .map(([week, clicks]) => ({ week, clicks }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);

    // --- Day-of-week distribution ---
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayDistribution = Array(7).fill(0);
    visits.forEach((v) => {
      const day = new Date(v.visitedAt).getDay();
      dayDistribution[day]++;
    });
    const dayOfWeekData = dayNames.map((name, idx) => ({
      day: name,
      clicks: dayDistribution[idx],
    }));

    // --- Hour-of-day distribution ---
    const hourDistribution = Array(24).fill(0);
    visits.forEach((v) => {
      const hour = new Date(v.visitedAt).getHours();
      hourDistribution[hour]++;
    });
    const hourOfDayData = hourDistribution.map((clicks, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      clicks,
    }));

    // --- Average clicks per day ---
    const totalDaysActive = Math.max(
      1,
      Math.ceil((Date.now() - new Date(link.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    );
    const avgClicksPerDay = parseFloat((totalVisits / totalDaysActive).toFixed(2));

    // --- Best performing day ---
    const bestDayEntry = dayOfWeekData.reduce(
      (best, curr) => (curr.clicks > best.clicks ? curr : best),
      { day: 'N/A', clicks: 0 }
    );

    // --- Device breakdown ---
    const deviceMap = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
    visits.forEach((v) => {
      const d = v.device || 'unknown';
      deviceMap[d] = (deviceMap[d] || 0) + 1;
    });
    const deviceBreakdown = Object.entries(deviceMap).map(([device, count]) => ({
      device,
      count,
    }));

    // --- Recent visits (last 20) ---
    const recentVisits = visits.slice(0, 20).map((v) => ({
      visitedAt: v.visitedAt,
      device: v.device || 'unknown',
    }));

    // --- Health score ---
    const healthScore = computeHealthScore(link, visits);
    const healthBadge = getHealthBadge(healthScore);

    // --- Last visit ---
    const lastVisit = visits.length > 0 ? visits[0].visitedAt : null;

    res.status(200).json({
      success: true,
      data: {
        link: {
          id: link._id,
          originalUrl: link.originalUrl,
          shortCode: link.shortCode,
          alias: link.alias,
          shortUrl: buildShortUrl(link.alias || link.shortCode),
          title: link.title,
          status: link.status,
          isExpired: isLinkExpired(link.expiryDate),
          expiryDate: link.expiryDate,
          isFavorite: link.isFavorite,
          createdAt: link.createdAt,
          qrCode: link.qrCode,
        },
        summary: {
          totalClicks: totalVisits,
          clicksInRange: visits.length,
          dateRange: daysNum,
          avgClicksPerDay,
          lastVisit,
          healthScore,
          healthBadge,
          bestPerformingDay: bestDayEntry.day,
        },
        charts: {
          dailyTrends,
          weeklyTrends,
          dayOfWeekData,
          hourOfDayData,
          deviceBreakdown,
        },
        recentVisits,
      },
    });
  } catch (error) {
    logger.error(`GetLinkAnalytics error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
};

/**
 * GET /api/analytics/:id/export
 * Export analytics visits as CSV
 */
const exportAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findOne({ _id: id, userId: req.userId });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found.' });
    }

    const visits = await Visit.find({ linkId: id }).sort({ visitedAt: -1 }).lean();

    if (visits.length === 0) {
      return res.status(404).json({ success: false, message: 'No visits to export.' });
    }

    const shortUrl = buildShortUrl(link.alias || link.shortCode);
    const headers = ['Short Code', 'Original URL', 'Short URL', 'Visit Date', 'Day', 'Hour', 'Device'];
    const rows = visits.map((v) => {
      const date = new Date(v.visitedAt);
      return [
        link.shortCode,
        `"${link.originalUrl.replace(/"/g, '""')}"`,
        shortUrl,
        date.toISOString(),
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
        date.getHours(),
        v.device || 'unknown',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics-${link.shortCode}-${Date.now()}.csv"`
    );
    res.status(200).send(csv);
  } catch (error) {
    logger.error(`ExportAnalytics error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to export analytics.' });
  }
};

module.exports = { getLinkAnalytics, exportAnalytics };
