/**
 * Component: MedicineSearchPage
 *
 * Description:
 *   Complete medicine search interface for the Smart Medicine
 *   Availability & Intelligent Janaushadhi Recommendation System.
 *
 * Responsibilities:
 *   - Manage shared search query + UI state across sections
 *   - Compose all search page sections in specification order
 *   - Act as a layout orchestrator with minimal business logic
 *   - Render within UserLayout (Sidebar + TopBar provided by layout)
 *
 * Section order (Module 7A complete specification):
 *   1. SearchHeaderSection      — hero title + illustration
 *   2. SearchInputSection       — primary search bar + example pills
 *        └─ SearchSuggestions   — inline below the search bar
 *   3. QuickActionsSection      — 4 quick action cards
 *   4. RecentSearchesSection    — recent search history
 *   5. PopularMedicinesSection  — popular medicine chips
 *   6. MedicineCategoriesSection — category browse grid
 *   7. SearchFiltersSection     — collapsible filter panel
 *   8. SearchLoadingSection     — skeleton placeholders (shown when loading)
 *   9. SearchEmptyState         — no-results UI
 *  10. SearchErrorState         — error / retry UI
 *
 * Route: /search (inside ProtectedRoute → UserLayout)
 *
 * Backend readiness:
 *   - Search      → GET /api/v1/medicines/search?q={query}
 *   - Suggestions → GET /api/v1/medicines/suggest?q={query}
 *   - Popular     → GET /api/v1/medicines/popular
 *   - Recent      → GET /api/v1/users/me/recent-searches
 *   - Categories  → GET /api/v1/medicines/categories
 *   - Filters     → POST /api/v1/medicines/search with filter body
 *   All deferred to Module 7B.
 *
 * Dependencies:
 *   - UserLayout (via React Router nesting — automatic)
 *   - All section components (./sections/*)
 *   - Divider (components/ui)
 */

import { useState, useCallback } from 'react'
import { useNavigate }            from 'react-router-dom'

// ── Sections ──────────────────────────────────────────────────────────────────
import SearchHeroSection         from './sections/SearchHeroSection'
import { useQuery } from '@tanstack/react-query'
import medicineService from '../../services/medicineService'
import SearchSuggestionsSection  from './sections/SearchSuggestionsSection'
import PopularMedicinesSection   from './sections/PopularMedicinesSection'
import MedicineCategoriesSection from './sections/MedicineCategoriesSection'
import SearchFiltersSection      from './sections/SearchFiltersSection'

import { ROUTES } from '../../constants/routes'

// =====================================================
// Medicine Search Page
// =====================================================
function MedicineSearchPage() {
  const [query,           setQuery]           = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const navigate = useNavigate()

  // ── Shared handlers ──────────────────────────────────────────────────────
  const handleSearch = useCallback((value) => {
    const trimmed = (value ?? query).trim()
    if (!trimmed) return
    setShowSuggestions(false)
    navigate(`${ROUTES.USER.SEARCH_RESULTS}?q=${encodeURIComponent(trimmed)}`)
  }, [query, navigate])

  const handleQueryChange = useCallback((value) => {
    setQuery(value)
    setShowSuggestions(value.trim().length > 0)
  }, [])

  const handleSuggestionSelect = useCallback((name) => {
    setQuery(name)
    setShowSuggestions(false)
    handleSearch(name)
  }, [handleSearch])

  const handleCloseSuggestions = useCallback(() => {
    setShowSuggestions(false)
  }, [])

  // Category / price filters open the results page with those filters.
  const handleFiltersApply = useCallback((filters) => {
    const params = new URLSearchParams()
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, value)
    })
    if ([...params.keys()].length === 0) return
    setShowSuggestions(false)
    navigate(`${ROUTES.USER.SEARCH_RESULTS}?${params.toString()}`)
  }, [navigate])

  const handleCategorySelect = useCallback(
    (category) => handleFiltersApply({ category }),
    [handleFiltersApply],
  )

  const { data: filterData } = useQuery({
    queryKey: ['medicines', 'filters'],
    queryFn: async () => (await medicineService.getFilters()).data,
    staleTime: 10 * 60 * 1000,
  })
  const totalMedicines = (filterData?.categories ?? []).reduce((sum, c) => sum + c.count, 0)

  return (
    <article aria-label="Medicine Search" className="max-w-6xl mx-auto pb-10">

      <SearchHeroSection
        query={query}
        onQueryChange={handleQueryChange}
        onSearch={handleSearch}
        suggestions={showSuggestions ? (
          <SearchSuggestionsSection
            query={query}
            onSelect={handleSuggestionSelect}
            onClose={handleCloseSuggestions}
          />
        ) : null}
      />

      <PopularMedicinesSection onSearch={handleSearch} total={totalMedicines} />

      <MedicineCategoriesSection onCategorySelect={handleCategorySelect} />

      <SearchFiltersSection onApply={handleFiltersApply} />

    </article>
  )
}

export default MedicineSearchPage