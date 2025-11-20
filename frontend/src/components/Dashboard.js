// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { transactionAPI, statsAPI } from '../services/apiService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ total_transactions: 0, total_spent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Transaction form state
  const [newTransaction, setNewTransaction] = useState({
    name: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load all data
      const [txns, statsData] = await Promise.all([
        transactionAPI.getAll(),
        statsAPI.get()
      ]);

      setTransactions(txns);
      setStats(statsData);
    } catch (err) {
      setError(err || 'Failed to load data');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    
    if (!newTransaction.name || !newTransaction.amount) {
      alert('Please fill in name and amount');
      return;
    }

    try {
      await transactionAPI.add({
        name: newTransaction.name,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        date: newTransaction.date
      });

      // Reset form
      setNewTransaction({
        name: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });

      // Reload data
      await loadData();
      alert('✅ Transaction added successfully!');
    } catch (err) {
      alert('❌ Failed to add transaction: ' + err);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionAPI.delete(id);
      await loadData();
      alert('✅ Transaction deleted!');
    } catch (err) {
      alert('❌ Failed to delete: ' + err);
    }
  };

  const handleUpdateCategory = async (id, newCategory) => {
    try {
      await transactionAPI.update(id, { category: newCategory });
      await loadData();
    } catch (err) {
      alert('❌ Failed to update: ' + err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClearData = async () => {
    if (!window.confirm('⚠️ Are you sure? This will delete ALL your transactions and budgets!')) {
      return;
    }

    try {
      await statsAPI.clearAll();
      await loadData();
      alert('✅ All data cleared!');
    } catch (err) {
      alert('❌ Failed to clear data: ' + err);
    }
  };

  // Calculate category totals
  const getCategoryTotals = () => {
    const totals = {};
    transactions.forEach(txn => {
      const category = txn.category || 'Other';
      totals[category] = (totals[category] || 0) + parseFloat(txn.amount || 0);
    });
    return totals;
  };

  const categoryTotals = getCategoryTotals();

  if (loading && transactions.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>💰 SmartSpend AI Dashboard</h1>
          <p>Welcome, {user?.email}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p className="stat-value">{stats.total_transactions}</p>
        </div>
        <div className="stat-card">
          <h3>Total Spent</h3>
          <p className="stat-value">${stats.total_spent.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Categories</h3>
          <p className="stat-value">{Object.keys(categoryTotals).length}</p>
        </div>
      </div>

      {/* Add Transaction Form */}
      <div className="card">
        <h2>➕ Add New Transaction</h2>
        <form onSubmit={handleAddTransaction} className="transaction-form">
          <input
            type="text"
            placeholder="Transaction name"
            value={newTransaction.name}
            onChange={(e) => setNewTransaction({...newTransaction, name: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newTransaction.description}
            onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
            required
          />
          <input
            type="date"
            value={newTransaction.date}
            onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
            required
          />
          <button type="submit" className="add-btn">Add Transaction</button>
        </form>
      </div>

      {/* Category Summary */}
      <div className="card">
        <h2>📊 Spending by Category</h2>
        <div className="category-grid">
          {Object.entries(categoryTotals).map(([category, total]) => (
            <div key={category} className="category-card">
              <h4>{category}</h4>
              <p className="category-amount">${total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="card-header">
          <h2>📝 Recent Transactions</h2>
          <button onClick={handleClearData} className="danger-btn">
            Clear All Data
          </button>
        </div>
        
        {transactions.length === 0 ? (
          <p className="empty-state">No transactions yet. Add your first one above!</p>
        ) : (
          <div className="transactions-list">
            {transactions.slice().reverse().map((txn) => (
              <div key={txn.id} className="transaction-item">
                <div className="transaction-info">
                  <h4>{txn.name}</h4>
                  <p className="transaction-desc">{txn.description}</p>
                  <p className="transaction-date">
                    {new Date(txn.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="transaction-details">
                  <span className="transaction-amount">
                    ${parseFloat(txn.amount).toFixed(2)}
                  </span>
                  <select
                    value={txn.category}
                    onChange={(e) => handleUpdateCategory(txn.id, e.target.value)}
                    className="category-select"
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Bills & Utilities">Bills & Utilities</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                  </select>
                  <button
                    onClick={() => handleDeleteTransaction(txn.id)}
                    className="delete-btn"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
