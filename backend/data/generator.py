import json
import os
import random
import numpy as np


def generate_dataset():
    random.seed(42)
    np.random.seed(42)

    years = ['2021', '2022', '2023', '2024', '2025']

    categories = [
        {
            'name': '白酒',
            'marketSize': 7800,
            'share': 62.5,
            'growth': [8.2, 7.5, 6.8, 5.5, 4.3],
            'color': '#8B0000'
        },
        {
            'name': '啤酒',
            'marketSize': 2200,
            'share': 17.6,
            'growth': [3.5, 3.2, 2.8, 2.5, 2.1],
            'color': '#F4A460'
        },
        {
            'name': '红酒',
            'marketSize': 980,
            'share': 7.8,
            'growth': [2.1, 1.5, 0.8, 1.2, 2.5],
            'color': '#B22222'
        },
        {
            'name': '黄酒',
            'marketSize': 320,
            'share': 2.6,
            'growth': [1.2, 0.8, 0.5, 0.3, 0.6],
            'color': '#DAA520'
        },
        {
            'name': '果酒清酒',
            'marketSize': 540,
            'share': 4.3,
            'growth': [12.5, 15.2, 18.8, 22.1, 25.6],
            'color': '#FF69B4'
        },
        {
            'name': '威士忌',
            'marketSize': 650,
            'share': 5.2,
            'growth': [18.5, 20.3, 22.8, 25.4, 28.1],
            'color': '#CD853F'
        }
    ]

    total_market = sum(c['marketSize'] for c in categories)
    for c in categories:
        c['share'] = round(c['marketSize'] / total_market * 100, 1)

    overview = {
        'totalMarket': total_market,
        'totalGrowth': 4.8,
        'categoryCount': 6,
        'highlightCategories': ['精酿啤酒', '威士忌'],
        'craftBeerIndex': 128.5
    }

    cities = [
        {
            'city': '哈尔滨',
            'region': '东北',
            'baijiu': 78.5,
            'beer': 15.2,
            'craftBeer': 4.2,
            'wine': 3.8,
            'huangjiu': 1.2,
            'whiskey': 2.8,
            'craftIndex': 88.5
        },
        {
            'city': '沈阳',
            'region': '东北',
            'baijiu': 75.8,
            'beer': 16.5,
            'craftBeer': 4.8,
            'wine': 4.2,
            'huangjiu': 1.5,
            'whiskey': 3.2,
            'craftIndex': 92.3
        },
        {
            'city': '上海',
            'region': '华东沿海',
            'baijiu': 48.2,
            'beer': 18.5,
            'craftBeer': 12.8,
            'wine': 35.6,
            'huangjiu': 2.8,
            'whiskey': 12.5,
            'craftIndex': 118.6
        },
        {
            'city': '深圳',
            'region': '华南沿海',
            'baijiu': 45.6,
            'beer': 20.2,
            'craftBeer': 14.5,
            'wine': 38.2,
            'huangjiu': 1.2,
            'whiskey': 15.8,
            'craftIndex': 125.2
        },
        {
            'city': '广州',
            'region': '华南沿海',
            'baijiu': 48.8,
            'beer': 22.5,
            'craftBeer': 11.2,
            'wine': 32.5,
            'huangjiu': 1.8,
            'whiskey': 12.2,
            'craftIndex': 112.8
        },
        {
            'city': '成都',
            'region': '西南',
            'baijiu': 62.5,
            'beer': 15.8,
            'craftBeer': 18.6,
            'wine': 12.5,
            'huangjiu': 1.5,
            'whiskey': 8.5,
            'craftIndex': 135.8
        },
        {
            'city': '重庆',
            'region': '西南',
            'baijiu': 65.2,
            'beer': 18.2,
            'craftBeer': 16.8,
            'wine': 10.8,
            'huangjiu': 1.2,
            'whiskey': 7.2,
            'craftIndex': 128.5
        },
        {
            'city': '北京',
            'region': '华北',
            'baijiu': 55.8,
            'beer': 16.5,
            'craftBeer': 10.5,
            'wine': 22.5,
            'huangjiu': 2.2,
            'whiskey': 9.8,
            'craftIndex': 108.5
        },
        {
            'city': '杭州',
            'region': '华东沿海',
            'baijiu': 50.2,
            'beer': 17.2,
            'craftBeer': 13.8,
            'wine': 28.5,
            'huangjiu': 3.2,
            'whiskey': 10.5,
            'craftIndex': 118.2
        },
        {
            'city': '武汉',
            'region': '华中',
            'baijiu': 58.5,
            'beer': 20.5,
            'craftBeer': 8.2,
            'wine': 15.2,
            'huangjiu': 2.2,
            'whiskey': 6.8,
            'craftIndex': 98.5
        },
        {
            'city': '西安',
            'region': '西北',
            'baijiu': 62.8,
            'beer': 18.5,
            'craftBeer': 6.5,
            'wine': 12.2,
            'huangjiu': 1.8,
            'whiskey': 5.2,
            'craftIndex': 92.8
        },
        {
            'city': '长沙',
            'region': '华中',
            'baijiu': 60.2,
            'beer': 19.8,
            'craftBeer': 8.8,
            'wine': 13.5,
            'huangjiu': 1.5,
            'whiskey': 6.2,
            'craftIndex': 102.5
        }
    ]

    price_ranges = [
        {
            'range': '百元以下',
            'share': 18.5,
            'trend': [25.2, 23.5, 21.8, 20.2, 18.5]
        },
        {
            'range': '100-300元',
            'share': 28.2,
            'trend': [26.5, 27.2, 27.8, 28.0, 28.2]
        },
        {
            'range': '300-800元',
            'share': 25.8,
            'trend': [22.5, 23.8, 24.5, 25.2, 25.8]
        },
        {
            'range': '800-2000元',
            'share': 18.5,
            'trend': [14.2, 15.5, 16.8, 17.8, 18.5]
        },
        {
            'range': '2000元以上',
            'share': 9.0,
            'trend': [6.8, 7.5, 8.2, 8.8, 9.0]
        }
    ]

    age_groups = [
        {
            'ageGroup': '18-25岁',
            'baijiu': 18.5,
            'beer': 28.5,
            'craftBeer': 18.2,
            'wine': 15.8,
            'sparkling': 12.5,
            'huangjiu': 2.5,
            'whiskey': 8.2
        },
        {
            'ageGroup': '26-30岁',
            'baijiu': 28.2,
            'beer': 24.5,
            'craftBeer': 15.8,
            'wine': 16.5,
            'sparkling': 8.5,
            'huangjiu': 3.2,
            'whiskey': 9.8
        },
        {
            'ageGroup': '31-40岁',
            'baijiu': 52.5,
            'beer': 18.2,
            'craftBeer': 8.5,
            'wine': 12.8,
            'sparkling': 3.2,
            'huangjiu': 4.5,
            'whiskey': 6.8
        },
        {
            'ageGroup': '41-50岁',
            'baijiu': 62.8,
            'beer': 14.5,
            'craftBeer': 4.2,
            'wine': 8.5,
            'sparkling': 1.5,
            'huangjiu': 6.2,
            'whiskey': 3.8
        },
        {
            'ageGroup': '51岁以上',
            'baijiu': 68.5,
            'beer': 12.2,
            'craftBeer': 1.8,
            'wine': 5.2,
            'sparkling': 0.8,
            'huangjiu': 8.5,
            'whiskey': 2.5
        }
    ]

    festivals = [
        {
            'festival': '春节',
            'data': [
                {
                    'category': '白酒',
                    'salesMultiple': [3.8, 4.0, 4.2, 4.3, 4.5],
                    'highEndRatio': [38.0, 39.5, 41.0, 42.0, 42.5]
                },
                {
                    'category': '红酒',
                    'salesMultiple': [2.3, 2.4, 2.5, 2.7, 2.8],
                    'highEndRatio': [31.0, 32.5, 33.8, 34.5, 35.2]
                },
                {
                    'category': '啤酒',
                    'salesMultiple': [1.5, 1.6, 1.7, 1.7, 1.8],
                    'highEndRatio': [13.0, 13.8, 14.5, 15.0, 15.5]
                },
                {
                    'category': '威士忌',
                    'salesMultiple': [1.8, 2.0, 2.1, 2.3, 2.5],
                    'highEndRatio': [41.0, 43.5, 45.8, 47.0, 48.2]
                }
            ]
        },
        {
            'festival': '情人节',
            'data': [
                {
                    'category': '白酒',
                    'salesMultiple': [1.0, 1.0, 1.1, 1.1, 1.2],
                    'highEndRatio': [24.0, 25.5, 27.0, 28.0, 28.5]
                },
                {
                    'category': '红酒',
                    'salesMultiple': [5.2, 5.6, 6.0, 6.4, 6.8],
                    'highEndRatio': [46.0, 48.0, 50.0, 51.2, 52.5]
                },
                {
                    'category': '香槟/起泡酒',
                    'salesMultiple': [6.0, 6.5, 7.0, 7.6, 8.2],
                    'highEndRatio': [55.0, 57.5, 59.8, 61.2, 62.8]
                },
                {
                    'category': '威士忌',
                    'salesMultiple': [1.3, 1.4, 1.5, 1.7, 1.8],
                    'highEndRatio': [36.0, 38.0, 40.2, 41.5, 42.5]
                }
            ]
        },
        {
            'festival': '中秋节',
            'data': [
                {
                    'category': '白酒',
                    'salesMultiple': [3.1, 3.3, 3.5, 3.7, 3.8],
                    'highEndRatio': [47.0, 48.5, 50.5, 51.8, 52.5]
                },
                {
                    'category': '红酒',
                    'salesMultiple': [2.5, 2.7, 2.9, 3.1, 3.2],
                    'highEndRatio': [43.0, 44.5, 46.2, 47.5, 48.2]
                },
                {
                    'category': '啤酒',
                    'salesMultiple': [1.2, 1.3, 1.4, 1.5, 1.5],
                    'highEndRatio': [15.0, 16.0, 17.0, 18.0, 18.5]
                },
                {
                    'category': '威士忌',
                    'salesMultiple': [2.0, 2.2, 2.4, 2.6, 2.8],
                    'highEndRatio': [48.0, 50.0, 52.5, 54.2, 55.8]
                }
            ]
        },
        {
            'festival': '国庆',
            'data': [
                {
                    'category': '白酒',
                    'salesMultiple': [2.3, 2.4, 2.6, 2.7, 2.8],
                    'highEndRatio': [33.0, 34.5, 36.2, 37.5, 38.5]
                },
                {
                    'category': '红酒',
                    'salesMultiple': [1.7, 1.8, 2.0, 2.1, 2.2],
                    'highEndRatio': [28.0, 29.5, 30.8, 31.8, 32.5]
                },
                {
                    'category': '啤酒',
                    'salesMultiple': [1.9, 2.1, 2.2, 2.4, 2.5],
                    'highEndRatio': [18.0, 19.5, 20.8, 21.8, 22.5]
                },
                {
                    'category': '威士忌',
                    'salesMultiple': [1.5, 1.6, 1.8, 1.9, 2.0],
                    'highEndRatio': [34.0, 35.8, 37.5, 39.0, 40.2]
                }
            ]
        },
        {
            'festival': '双十一',
            'data': [
                {
                    'category': '白酒',
                    'salesMultiple': [2.2, 2.5, 2.8, 3.0, 3.2],
                    'highEndRatio': [29.0, 31.0, 32.8, 34.2, 35.2]
                },
                {
                    'category': '红酒',
                    'salesMultiple': [3.0, 3.4, 3.8, 4.2, 4.5],
                    'highEndRatio': [23.0, 24.5, 26.2, 27.5, 28.5]
                },
                {
                    'category': '啤酒',
                    'salesMultiple': [2.5, 2.9, 3.2, 3.6, 3.8],
                    'highEndRatio': [11.0, 12.2, 13.5, 14.5, 15.2]
                },
                {
                    'category': '威士忌',
                    'salesMultiple': [2.8, 3.2, 3.6, 3.9, 4.2],
                    'highEndRatio': [32.0, 34.0, 36.0, 37.5, 38.5]
                }
            ]
        }
    ]

    import_compare = [
        {
            'year': '2021',
            'importWineShare': 38.5,
            'domesticWineShare': 61.5,
            'importWhiskeyShare': 72.5,
            'domesticWhiskeyShare': 27.5,
            'tariffRate': 14.0
        },
        {
            'year': '2022',
            'importWineShare': 35.2,
            'domesticWineShare': 64.8,
            'importWhiskeyShare': 70.2,
            'domesticWhiskeyShare': 29.8,
            'tariffRate': 14.0
        },
        {
            'year': '2023',
            'importWineShare': 32.8,
            'domesticWineShare': 67.2,
            'importWhiskeyShare': 67.8,
            'domesticWhiskeyShare': 32.2,
            'tariffRate': 12.0
        },
        {
            'year': '2024',
            'importWineShare': 30.5,
            'domesticWineShare': 69.5,
            'importWhiskeyShare': 65.2,
            'domesticWhiskeyShare': 34.8,
            'tariffRate': 10.0
        },
        {
            'year': '2025',
            'importWineShare': 28.2,
            'domesticWineShare': 71.8,
            'importWhiskeyShare': 62.5,
            'domesticWhiskeyShare': 37.5,
            'tariffRate': 8.0
        }
    ]

    dataset = {
        'overview': overview,
        'categories': categories,
        'years': years,
        'cities': cities,
        'priceRanges': price_ranges,
        'ageGroups': age_groups,
        'festivals': festivals,
        'importCompare': import_compare
    }

    return dataset


def save_dataset(dataset, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f'Dataset saved to: {output_path}')


if __name__ == '__main__':
    data = generate_dataset()
    output = os.path.join(os.path.dirname(__file__), 'dataset.json')
    save_dataset(data, output)
