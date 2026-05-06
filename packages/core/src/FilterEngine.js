export class FilterEngine {
  constructor() {
    this.config = [];
    this.activeFilters = new Map();
  }

  setFilterConfig(config) {
    this.config = config;
    this.activeFilters.clear();
  }

  setFilter(filterId, value) {
    if (value === null || value === undefined || value === '') {
      this.activeFilters.delete(filterId);
    } else {
      this.activeFilters.set(filterId, value);
    }
  }

  clearFilters() {
    this.activeFilters.clear();
  }

  getActiveFilters() {
    const result = {};
    for (const [id, value] of this.activeFilters) {
      const filterConfig = this.config.find(f => f.id === id);
      if (filterConfig) {
        result[filterConfig.field] = value;
      }
    }
    return result;
  }

  apply(features) {
    if (this.activeFilters.size === 0) return features;

    return features.filter(feature => {
      for (const [filterId, value] of this.activeFilters) {
        const filterConfig = this.config.find(f => f.id === filterId);
        if (!filterConfig) continue;

        const fieldValue = feature.properties?.[filterConfig.field];

        if (!this._matchesFilter(fieldValue, value, filterConfig.filter_type)) {
          return false;
        }
      }
      return true;
    });
  }

  _matchesFilter(fieldValue, filterValue, filterType) {
    if (fieldValue === undefined || fieldValue === null) return false;

    switch (filterType) {
      case 'select':
        return String(fieldValue) === String(filterValue);
      case 'multiselect':
        return Array.isArray(filterValue) && filterValue.includes(String(fieldValue));
      case 'toggle':
        return Boolean(fieldValue) === Boolean(filterValue);
      case 'range': {
        const num = Number(fieldValue);
        if (filterValue.min !== undefined && num < filterValue.min) return false;
        if (filterValue.max !== undefined && num > filterValue.max) return false;
        return true;
      }
      case 'search':
        return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
      default:
        return true;
    }
  }
}
