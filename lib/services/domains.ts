/**
 * Domain service for real-time Chrome history-based domain suggestions
 */

export interface DomainSuggestion {
  domain: string;
  type: 'domain';
}

class DomainService {
  private cache = new Map<string, { domains: string[]; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache for search results

  /**
   * Get domain suggestions that match the input using real-time Chrome history search
   */
  async getDomainSuggestions(input: string, maxResults: number = 5): Promise<string[]> {
    if (!input || input.trim() === '' || input.length < 2) {
      return [];
    }

    const searchTerm = input.toLowerCase().trim();

    // Check cache first
    const cached = this.cache.get(searchTerm);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.domains.slice(0, maxResults);
    }

    try {
      // Search Chrome history in real-time
      const historyItems = await browser.history.search({
        text: searchTerm,
        maxResults: 1000
      });

      // Extract and process domains
      const domainCounts = new Map<string, number>();

      for (const item of historyItems) {
        if (!item.url) continue;

        try {
          const url = new URL(item.url);
          const domain = url.hostname.toLowerCase();

          // Skip localhost, IP addresses, and common non-website domains
          if (domain === 'localhost' ||
              /^\d+\.\d+\.\d+\.\d+$/.test(domain) ||
              domain.startsWith('chrome-') ||
              domain.includes('extension') ||
              domain.includes('moz-extension')) {
            continue;
          }

          // Remove www. prefix for consistency
          const cleanDomain = domain.replace(/^www\./, '');

          // Only include domains that contain the search term
          if (cleanDomain.toLowerCase().includes(searchTerm)) {
            const count = domainCounts.get(cleanDomain) || 0;
            domainCounts.set(cleanDomain, count + (item.visitCount || 1));
          }
        } catch (urlError) {
          // Skip invalid URLs
          continue;
        }
      }

      // Sort domains by visit count and alphabetically
      const sortedDomains = Array.from(domainCounts.entries())
        .filter(([domain, count]) => count >= 1) // At least 1 visit
        .sort((a, b) => {
          // Primary sort by visit count, secondary by alphabetical
          const countDiff = b[1] - a[1];
          if (countDiff !== 0) return countDiff;
          return a[0].localeCompare(b[0]);
        })
        .map(([domain]) => domain)
        .slice(0, 20); // Keep top 20 for caching

      // Cache the results
      this.cache.set(searchTerm, {
        domains: sortedDomains,
        timestamp: Date.now()
      });

      // Clean old cache entries (keep cache size reasonable)
      if (this.cache.size > 50) {
        const oldestKey = Array.from(this.cache.keys())[0];
        this.cache.delete(oldestKey);
      }

      return sortedDomains.slice(0, maxResults);
    } catch (error) {
      console.warn('Failed to search Chrome history for domains:', error);
      return [];
    }
  }

  /**
   * Get all cached domains (for debugging)
   */
  getAllCachedDomains(): string[] {
    const allDomains = new Set<string>();
    for (const { domains } of this.cache.values()) {
      domains.forEach(domain => allDomains.add(domain));
    }
    return Array.from(allDomains).sort();
  }

  /**
   * Check if service has any cached data
   */
  hasCachedData(): boolean {
    return this.cache.size > 0;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; totalDomains: number } {
    const totalDomains = new Set<string>();
    for (const { domains } of this.cache.values()) {
      domains.forEach(domain => totalDomains.add(domain));
    }

    return {
      entries: this.cache.size,
      totalDomains: totalDomains.size
    };
  }
}

// Export singleton instance
export const domainService = new DomainService();
