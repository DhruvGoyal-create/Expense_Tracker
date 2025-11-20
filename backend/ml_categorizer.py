"""
ML-based transaction categorizer with weighted keyword matching
"""

CATEGORIES = [
    'Food & Dining',
    'Transportation', 
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Housing',
    'Other'
]

CATEGORY_KEYWORDS = {
    'Food & Dining': {
        'keywords': [
            'food', 'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald',
            'burger', 'pizza', 'uber eats', 'doordash', 'grubhub', 'zomato',
            'swiggy', 'dominos', 'kfc', 'subway', 'chipotle', 'taco', 'sushi',
            'dining', 'lunch', 'dinner', 'breakfast', 'bar', 'pub', 'deli',
            'bakery', 'ice cream', 'dunkin', 'panera', 'wendys'
        ],
        'weight': 1.0
    },
    'Transportation': {
        'keywords': [
            'uber', 'lyft', 'ola', 'taxi', 'cab', 'gas', 'fuel', 'petrol',
            'shell', 'chevron', 'exxon', 'bp', 'parking', 'metro', 'train',
            'bus', 'airline', 'flight', 'transit', 'toll', 'car wash',
            'auto', 'vehicle'
        ],
        'weight': 1.0
    },
    'Shopping': {
        'keywords': [
            'amazon', 'flipkart', 'myntra', 'ebay', 'walmart', 'target',
            'costco', 'shop', 'store', 'mall', 'retail', 'clothing',
            'fashion', 'grocery', 'supermarket', 'trader', 'whole foods',
            'best buy', 'nike', 'adidas', 'h&m', 'zara'
        ],
        'weight': 1.0
    },
    'Entertainment': {
        'keywords': [
            'netflix', 'spotify', 'prime', 'hulu', 'disney', 'hotstar',
            'movie', 'cinema', 'theatre', 'game', 'steam', 'playstation',
            'xbox', 'nintendo', 'concert', 'ticket', 'entertainment',
            'youtube', 'music', 'subscription'
        ],
        'weight': 1.0
    },
    'Bills & Utilities': {
        'keywords': [
            'electric', 'electricity', 'water', 'internet', 'wifi',
            'phone', 'mobile', 'bill', 'utility', 'insurance', 'gas bill',
            'verizon', 'at&t', 'comcast', 'spectrum', 'airtel', 'jio',
            'vodafone', 'broadband'
        ],
        'weight': 1.0
    },
    'Healthcare': {
        'keywords': [
            'pharmacy', 'medical', 'doctor', 'hospital', 'health',
            'clinic', 'dental', 'dentist', 'cvs', 'walgreens', 'apollo',
            'medicine', 'drug', 'prescription', 'lab', 'test', 'checkup'
        ],
        'weight': 1.0
    },
    'Housing': {
        'keywords': [
            'rent', 'mortgage', 'housing', 'apartment', 'lease',
            'landlord', 'property', 'real estate', 'hoa', 'maintenance'
        ],
        'weight': 1.5  # Higher weight for housing
    }
}

def categorize_transaction(description: str, amount: float) -> str:
    """
    Categorize transaction using ML-inspired weighted keyword matching
    
    Args:
        description: Transaction description/name
        amount: Transaction amount
        
    Returns:
        Category name (string)
    """
    if not description:
        return 'Other'
    
    desc_lower = description.lower()
    scores = {}
    
    # Calculate scores for each category
    for category, data in CATEGORY_KEYWORDS.items():
        score = 0
        keywords = data['keywords']
        weight = data['weight']
        
        for keyword in keywords:
            if keyword in desc_lower:
                # Exact word match gets higher score
                if keyword == desc_lower or f' {keyword} ' in f' {desc_lower} ':
                    score += 2 * weight
                else:
                    score += 1 * weight
        
        scores[category] = score
    
    # Special rules for amount-based categorization
    if amount >= 10000:  # Large amounts likely housing
        scores['Housing'] = scores.get('Housing', 0) + 3
    
    if amount >= 5000 and amount < 10000:  # Medium-large likely bills
        scores['Bills & Utilities'] = scores.get('Bills & Utilities', 0) + 1
    
    # Find category with highest score
    max_score = max(scores.values()) if scores else 0
    
    if max_score > 0:
        # Return category with highest score
        return max(scores.items(), key=lambda x: x[1])[0]
    
    return 'Other'


def get_category_color(category: str) -> str:
    """Get color code for category visualization"""
    colors = {
        'Food & Dining': '#FF6B6B',
        'Transportation': '#4ECDC4',
        'Shopping': '#45B7D1',
        'Entertainment': '#FFA07A',
        'Bills & Utilities': '#98D8C8',
        'Healthcare': '#F7DC6F',
        'Housing': '#BB8FCE',
        'Other': '#95A5A6'
    }
    return colors.get(category, '#95A5A6')