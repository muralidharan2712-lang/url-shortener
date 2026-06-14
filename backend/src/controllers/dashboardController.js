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
 * GET /api/dashboard/summary
 * Returns aggregated stats for the user's dashboard
 */
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();

    // Fetch all user links (lean for performance)
    const allLinks = await Link.find({ userId }).lean();

    // Counts
    const totalLinks = allLinks.length;
    const activeLinks = allLinks.filter(
      (l) => l.status === 'active' && !isLinkExpired(l.expiryDate)
    ).length;
    const expiredLinks = allLinks.filter(
      (l) => l.status === 'expired' || isLinkExpired(l.expiryDate)
    ).length;
    const favoriteLinks = allLinks.filter((l) => l.isFavorite).length;
    const totalClicks = allLinks.reduce((sum, l) => sum + (l.clickCount || 0), 0);

    // Links created this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newLinksThisWeek = allLinks.filter(
      (l) => new Date(l.createdAt) > weekAgo
    ).length;

    // Clicks this week from visits
    const clicksThisWeek = await Visit.countDocuments({
      userId,
      visitedAt: { $gte: weekAgo },
    });

    // Average health score across all links
    const linkIds = allLinks.map((l) => l._id);
    const recentVisits = linkIds.length > 0
      ? await Visit.find({ linkId: { $in: linkIds } })
          .sort({ visitedAt: -1 })
          .lean()
      : [];

    const visitsByLink = {};
    recentVisits.forEach((v) => {
      const key = v.linkId.toString();
      if (!visitsByLink[key]) visitsByLink[key] = [];
      if (visitsByLink[key].length < 50) visitsByLink[key].push(v);
    });

    let totalHealthScore = 0;
    allLinks.forEach((link) => {
      const visits = visitsByLink[link._id.toString()] || [];
      totalHealthScore += computeHealthScore(link, visits);
    });
    const avgHealthScore = totalLinks > 0
      ? Math.round(totalHealthScore / totalLinks)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalLinks,
        activeLinks,
        expiredLinks,
        favoriteLinks,
        totalClicks,
        newLinksThisWeek,
        clicksThisWeek,
        avgHealthScore,
        healthBadge: getHealthBadge(avgHealthScore),
      },
    });
  } catch (error) {
    logger.error(`GetDashboardSummary error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary.' });
  }
};

/**
 * GET /api/dashboard/top-links
 * Returns the top 10 performing links by click count
 */
const getTopLinks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

    const topLinks = await Link.find({ userId: req.userId })
      .sort({ clickCount: -1 })
      .limit(limitNum)
      .lean();

    const enriched = topLinks.map((link) => ({
      ...link,
      shortUrl: buildShortUrl(link.alias || link.shortCode),
      isExpired: isLinkExpired(link.expiryDate),
    }));

    res.status(200).json({
      success: true,
      data: { topLinks: enriched },
    });
  } catch (error) {
    logger.error(`GetTopLinks error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch top links.' });
  }
};

/**
 * GET /api/dashboard/recent-activity
 * Returns recent visit activity across all user links (activity feed)
 */
const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // Get user's link IDs
    const userLinks = await Link.find({ userId: req.userId })
      .select('_id shortCode alias originalUrl title')
      .lean();

    const linkMap = {};
    userLinks.forEach((l) => {
      linkMap[l._id.toString()] = l;
    });
    const linkIds = Object.keys(linkMap);

    if (linkIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { activities: [] },
      });
    }

    // Get recent visits
    const recentVisits = await Visit.find({
      linkId: { $in: linkIds },
    })
      .sort({ visitedAt: -1 })
      .limit(limitNum)
      .lean();

    const activities = recentVisits.map((visit) => {
      const link = linkMap[visit.linkId.toString()];
      return {
        visitId: visit._id,
        visitedAt: visit.visitedAt,
        device: visit.device || 'unknown',
        link: link
          ? {
              id: link._id,
              shortCode: link.shortCode,
              alias: link.alias,
              title: link.title,
              originalUrl: link.originalUrl,
              shortUrl: buildShortUrl(link.alias || link.shortCode),
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: { activities },
    });
  } catch (error) {
    logger.error(`GetRecentActivity error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch recent activity.' });
  }
};

/**
 * GET /api/dashboard/favorites
 * Returns all favorite links for the user
 */
const getFavoriteLinks = async (req, res) => {
  try {
    const favorites = await Link.find({
      userId: req.userId,
      isFavorite: true,
    })
      .sort({ clickCount: -1 })
      .lean();

    const enriched = favorites.map((link) => ({
      ...link,
      shortUrl: buildShortUrl(link.alias || link.shortCode),
      isExpired: isLinkExpired(link.expiryDate),
    }));

    res.status(200).json({
      success: true,
      data: { favorites: enriched },
    });
  } catch (error) {
    logger.error(`GetFavoriteLinks error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch favorite links.' });
  }
};

/**
 * GET /api/dashboard/health
 * Returns health scores for all user links
 */
const getHealthOverview = async (req, res) => {
  try {
    const allLinks = await Link.find({ userId: req.userId }).lean();

    if (allLinks.length === 0) {
      return res.status(200).json({
        success: true,
        data: { links: [], distribution: {} },
      });
    }

    const linkIds = allLinks.map((l) => l._id);
    const recentVisits = await Visit.find({ linkId: { $in: linkIds } })
      .sort({ visitedAt: -1 })
      .lean();

    const visitsByLink = {};
    recentVisits.forEach((v) => {
      const key = v.linkId.toString();
      if (!visitsByLink[key]) visitsByLink[key] = [];
      if (visitsByLink[key].length < 50) visitsByLink[key].push(v);
    });

    const distribution = { Excellent: 0, Good: 0, Fair: 0, Poor: 0, Critical: 0 };

    const linksWithHealth = allLinks.map((link) => {
      const visits = visitsByLink[link._id.toString()] || [];
      const healthScore = computeHealthScore(link, visits);
      const healthBadge = getHealthBadge(healthScore);
      distribution[healthBadge]++;

      return {
        id: link._id,
        shortCode: link.shortCode,
        alias: link.alias,
        title: link.title,
        originalUrl: link.originalUrl,
        shortUrl: buildShortUrl(link.alias || link.shortCode),
        clickCount: link.clickCount,
        healthScore,
        healthBadge,
        isExpired: isLinkExpired(link.expiryDate),
        status: link.status,
      };
    }).sort((a, b) => b.healthScore - a.healthScore);

    res.status(200).json({
      success: true,
      data: {
        links: linksWithHealth,
        distribution,
      },
    });
  } catch (error) {
    logger.error(`GetHealthOverview error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch health overview.' });
  }
};

module.exports = {
  getDashboardSummary,
  getTopLinks,
  getRecentActivity,
  getFavoriteLinks,
  getHealthOverview,
};
