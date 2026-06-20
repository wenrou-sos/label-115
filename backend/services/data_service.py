import json
import os
from typing import Any, Dict

from config import DATASET_PATH


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


