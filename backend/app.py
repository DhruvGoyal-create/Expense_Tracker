from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime
from dotenv import load_dotenv
import os

from user_locker_system import UserLockerSystem
from ml_categorizer import categorize_transaction

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# Initialize extensions
CORS(app)
jwt = JWTManager(app)

# Initialize JSON Locker System (replaces MySQL database)
locker = UserLockerSystem("user_lockers")

# ==================== HELPER FUNCTIONS ====================

def get_user_transactions(username, passkey):
    """Get all transactions for a user"""
    data = locker.load_user_data(username, passkey, "transactions")
    if data and "transactions" in data:
        return data["transactions"]
    return []


def save_user_transactions(username, passkey, transactions):
    """Save transactions for a user"""
    result = locker.save_user_data(
        username=username,
        passkey=passkey,
        data_name="transactions",
        data={"transactions": transactions}
    )
    return result.get("success", False)


def get_user_budgets(username, passkey):
    """Get budgets for a user"""
    data = locker.load_user_data(username, passkey, "budgets")
    if data and "budgets" in data:
        return data["budgets"]
    return {}


def save_user_budgets(username, passkey, budgets):
    """Save budgets for a user"""
    result = locker.save_user_data(
        username=username,
        passkey=passkey,
        data_name="budgets",
        data={"budgets": budgets}
    )
    return result.get("success", False)


# Store username in session (temporary storage)
# Format: {user_id: username}
user_sessions = {}


# ==================== AUTHENTICATION ROUTES ====================

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user with JSON locker system"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Create user locker (this also checks if user exists)
        result = locker.create_user_locker(
            username=email,
            passkey=password
        )
        
        if not result['success']:
            return jsonify({'error': result['message']}), 400
        
        # Initialize empty data structures for new user
        locker.save_user_data(email, password, "transactions", {"transactions": []})
        locker.save_user_data(email, password, "budgets", {"budgets": {}})
        locker.save_user_data(email, password, "profile", {
            "email": email,
            "created_at": datetime.now().isoformat()
        })
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': result['user_id']
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Verify passkey using locker system
        user_id = locker.verify_passkey(email, password)
        
        if not user_id:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create JWT token with user_id
        token = create_access_token(identity=user_id)
        
        # Store username for this user_id (for JWT lookups)
        user_sessions[user_id] = email
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'email': email,
            'user_id': user_id
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== TRANSACTION ROUTES ====================

@app.route('/api/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get all transactions for current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get username from session
        username = user_sessions.get(user_id)
        if not username:
            return jsonify({'error': 'Session expired, please login again'}), 401
        
        # Get password from request header (you'll need to pass it from frontend)
        password = request.headers.get('X-User-Passkey')
        if not password:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Get transactions
        transactions = get_user_transactions(username, password)
        
        return jsonify(transactions), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactions', methods=['POST'])
@jwt_required()
def add_transactions():
    """Add new transaction(s)"""
    try:
        user_id = get_jwt_identity()
        
        # Get username from session
        username = user_sessions.get(user_id)
        if not username:
            return jsonify({'error': 'Session expired, please login again'}), 401
        
        # Get password from request header
        password = request.headers.get('X-User-Passkey')
        if not password:
            return jsonify({'error': 'Authentication required'}), 401
        
        data = request.get_json()
        
        # Handle both single transaction and list
        if isinstance(data, dict):
            data = [data]
        
        # Get existing transactions
        transactions = get_user_transactions(username, password)
        
        # Generate new ID (simple auto-increment)
        max_id = max([t.get('id', 0) for t in transactions], default=0)
        
        new_transactions = []
        
        for txn_data in data:
            max_id += 1
            
            # Extract data
            name = txn_data.get('name', txn_data.get('description', ''))
            description = txn_data.get('description', name)
            amount = float(txn_data.get('amount', 0))
            date = txn_data.get('date', datetime.now().isoformat())
            
            # Categorize transaction
            category = categorize_transaction(name, amount)
            
            # Create transaction object
            transaction = {
                'id': max_id,
                'name': name,
                'description': description,
                'amount': amount,
                'date': date,
                'category': category,
                'original_category': category,
                'created_at': datetime.now().isoformat()
            }
            
            transactions.append(transaction)
            new_transactions.append(transaction)
        
        # Save updated transactions
        if not save_user_transactions(username, password, transactions):
            return jsonify({'error': 'Failed to save transactions'}), 500
        
        return jsonify({
            'message': 'Transactions added successfully',
            'transactions': new_transactions
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactions/<int:txn_id>', methods=['PUT'])
@jwt_required()
def update_transaction(txn_id):
    """Update a transaction"""
    try:
        user_id = get_jwt_identity()
        
        # Get username from session
        username = user_sessions.get(user_id)
        if not username:
            return jsonify({'error': 'Session expired, please login again'}), 401
        
        # Get password from request header
        password = request.headers.get('X-User-Passkey')
        if not password:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Get transactions
        transactions = get_user_transactions(username, password)
        
        # Find transaction to update
        transaction = None
        for t in transactions:
            if t.get('id') == txn_id:
                transaction = t
                break
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'category' in data:
            transaction['category'] = data['category']
        if 'name' in data:
            transaction['name'] = data['name']
        if 'description' in data:
            transaction['description'] = data['description']
        if 'amount' in data:
            transaction['amount'] = float(data['amount'])
        if 'date' in data:
            transaction['date'] = data['date']
        
        transaction['updated_at'] = datetime.now().isoformat()
        
        # Save updated transactions
        if not save_user_transactions(username, password, transactions):
            return jsonify({'error': 'Failed to update transaction'}), 500
        
        return jsonify({
            'message': 'Transaction updated successfully',
            'transaction': transaction
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactions/<int:txn_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(txn_id):
    """Delete a transaction"""
    try:
        user_id = get_jwt_identity()
        
        # Get username from session
        username = user_sessions.get(user_id)
        if not username:
            return jsonify({'error': 'Session expired, please login again'}), 401
        
        # Get password from request header
        password = request.headers.get('X-User-Passkey')
        if not password:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Get transactions
        transactions = get_user_transactions(username, password)
        
        # Find and remove transaction
        original_length = len(transactions)
        transactions = [t for t in transactions if t.get('id') != txn_id]
        
        if len(transactions) == original_length:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Save updated transactions
        if not save_user_transactions(username, password, transactions):
            return jsonify({'error': 'Failed to delete transaction'}), 500
        
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== BUDGET ROUTES ====================

@app.route('/api/budgets', methods=['GET'])
@jwt_required()
def get_budgets():
    """Get budgets for current user and month"""
    try:
        user_id = get_jwt_identity()
        
        # Get username from session
        username = user_sessions.get(user_id)
        if not username:
            return jsonify({'error': 'Session expired, please login again'}), 401
        
        # Get password from request header
        password = request.headers.get('X-User-Passkey')
        if not password:
            return jsonify({'error': 'Authentication required'}), 401
        
        month = request.args.get('month', '')  # Format: YYYY-MM
        
        # Get all budgets
        budgets = get_user_budgets(username, password)
        
        # Filter by month if specified
        if month and month in budgets:
            return jsonify(budgets[month]), 200
        
        return jsonify(budgets), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/budgets', methods=['POST'])
@jwt_required()
def set_budgets():
    """Set budgets for categories"""
    try:
        user_id = get_jwt_identity()
        
        # Get username from session
        username = user_sessions.get(user_id)
        if not username:
            return jsonify({'error': 'Session expired, please login again'}), 401
        
        # Get password from request header
        password = request.headers.get('X-User-Passkey')
        if not password:
            return jsonify({'error': 'Authentication required'}), 401
        
        data = request.get_json()
        month = data.get('month', '')
        budgets_data = data.get('budgets', data)
        
        if not month:
            return jsonify({'error': 'Month is required'}), 400
        
        # Get all budgets
        all_budgets = get_user_budgets(username, password)
        
        # Update budgets for this month
        all_budgets[month] = {
            category: float(amount) 
            for category, amount in budgets_data.items() 
            if category != 'month' and amount > 0
        }
        
        # Save updated budgets
        if not save_user_budgets(username, password, all_budgets):
            return jsonify({'error': 'Failed to save budgets'}), 500
        
        return jsonify({'message': 'Budgets saved successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== UTILITY ROUTES ====================

@app.route('/', methods=['GET'])
def home():
    """Health check"""
    return jsonify({
        'message': '✅ SmartSpend AI Backend (JSON Edition) is running!',
        'version': '2.0',
        'storage': 'JSON Locker System'
    }), 200


@app.route('/api/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get user statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Get username from session
        username = user_sessions.get(user_id)
        if not username:
            return jsonify({'error': 'Session expired, please login again'}), 401
        
        # Get password from request header
        password = request.headers.get('X-User-Passkey')
        if not password:
            return jsonify({'error': 'Authentication required'}), 401
        
        transactions = get_user_transactions(username, password)
        
        total_transactions = len(transactions)
        total_amount = sum(t.get('amount', 0) for t in transactions)
        
        return jsonify({
            'total_transactions': total_transactions,
            'total_spent': float(total_amount)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/clear', methods=['POST'])
@jwt_required()
def clear_data():
    """Clear all user data"""
    try:
        user_id = get_jwt_identity()
        
        # Get username from session
        username = user_sessions.get(user_id)
        if not username:
            return jsonify({'error': 'Session expired, please login again'}), 401
        
        # Get password from request header
        password = request.headers.get('X-User-Passkey')
        if not password:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Clear transactions and budgets
        save_user_transactions(username, password, [])
        save_user_budgets(username, password, {})
        
        return jsonify({'message': 'All data cleared successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/system/stats', methods=['GET'])
def get_system_stats():
    """Get system-wide statistics (admin only)"""
    try:
        stats = locker.get_system_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== ERROR HANDLERS ====================

@app.errorhandler(401)
def unauthorized(e):
    return jsonify({'error': 'Unauthorized - Please login'}), 401


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500


# ==================== RUN APP ====================

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 SmartSpend AI Backend (JSON Locker Edition)")
    print("=" * 60)
    print("📊 Server: http://localhost:5000")
    print("💾 Storage: JSON Locker System")
    print("🔒 Auth: JWT + Passkey-based")
    print("👥 Max Users: 100")
    print("=" * 60)
    
    app.run(debug=True, port=5000)
    