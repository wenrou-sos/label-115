import json
import os
from typing import Any, Dict, List, Optional

from config import DATASET_PATH


def linear_regression_predict(series: List[float], steps: int = 2) -> List[float]:
    n = len(series)
    if n == 0:
        return [0.0] * steps
    xs = list(range(n))
    x_mean = sum(xs) / n
    y_mean = sum(series) / n
    num = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, series))
    den = sum((x - x_mean) ** 2 for x in xs)
    slope = num / den if abs(den) > 1e-9 else 0.0
    intercept = y_mean - slope * x_mean
    return [round(slope * (n + i) + intercept, 2) for i in range(1, steps + 1)]


class DataService:
    _instance = None
    _dataset: Dict[str, Any] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_dataset()
        return cls._instance

    def _load_dataset(self):
        if not os.path.exists(DATASET_PATH):
            from data.generator import generate_dataset, save_dataset
            data = generate_dataset()
            save_dataset(data, DATASET_PATH)
        with open(DATASET_PATH, 'r', encoding='utf-8') as f:
            self._dataset = json.load(f)

    def reload(self):
        self._load_dataset()

    def get_overview(self) -> Dict[str, Any]:
        return self._dataset['overview']

    def get_categories(self) -> Dict[str, Any]:
        return {
            'categories': self._dataset['categories'],
            'years': self._dataset['years']
        }

    def get_regions(self, region_filter: str = None) -> Dict[str, Any]:
        cities = self._dataset['cities']
        if region_filter and region_filter != 'all':
            cities = [c for c in cities if c['region'] == region_filter]
        cities_sorted = sorted(cities, key=lambda x: x['craftIndex'], reverse=True)
        return {
            'cities': cities_sorted,
            'regions': list(set(c['region'] for c in self._dataset['cities']))
        }

    def get_price_ranges(self) -> Dict[str, Any]:
        return {
            'priceRanges': self._dataset['priceRanges'],
            'years': self._dataset['years']
        }

    def get_age_groups(self) -> Dict[str, Any]:
        return {
            'ageGroups': self._dataset['ageGroups']
        }

    def get_festivals(self) -> Dict[str, Any]:
        return {
            'festivals': self._dataset['festivals']
        }

    def get_import_compare(self) -> Dict[str, Any]:
        return {
            'importCompare': self._dataset['importCompare']
        }

    def get_forecast(
        self,
        module: str,
        entity: Optional[str] = None,
        metric: Optional[str] = None,
        steps: int = 2
    ) -> Dict[str, Any]:
        years = self._dataset.get('years', [])
        start_year = int(years[-1]) + 1 if years else 2026
        forecast_years = [str(start_year + i) for i in range(steps)]

        if module == 'category':
            result_series: List[Dict[str, Any]] = []
            for cat in self._dataset.get('categories', []):
                if entity and cat['name'] != entity:
                    continue
                historical = cat.get('growth', [])
                forecast = linear_regression_predict(historical, steps)
                result_series.append({
                    'name': cat['name'],
                    'color': cat.get('color'),
                    'historical': historical,
                    'forecast': forecast
                })
            return {
                'module': 'category',
                'historicalYears': years,
                'forecastYears': forecast_years,
                'series': result_series
            }

        if module == 'festival':
            result_festivals: List[Dict[str, Any]] = []
            for fest in self._dataset.get('festivals', []):
                if entity and fest['festival'] != entity:
                    continue
                data_items = []
                for item in fest.get('data', []):
                    metric_key = metric or 'salesMultiple'
                    historical = item.get(metric_key, [])
                    if isinstance(historical, list):
                        forecast = linear_regression_predict(historical, steps)
                    else:
                        historical = [float(historical)] * len(years)
                        forecast = linear_regression_predict(historical, steps)
                    data_items.append({
                        'category': item['category'],
                        'historical': historical,
                        'forecast': forecast
                    })
                result_festivals.append({
                    'festival': fest['festival'],
                    'data': data_items
                })
            return {
                'module': 'festival',
                'historicalYears': years,
                'forecastYears': forecast_years,
                'festivals': result_festivals
            }

        return {
            'module': module,
            'historicalYears': years,
            'forecastYears': forecast_years,
            'series': []
        }


