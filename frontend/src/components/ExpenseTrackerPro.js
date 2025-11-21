import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Calendar, TrendingUp, DollarSign, MessageSquare, Send, X, Menu, Plus, Target, AlertCircle, CheckCircle, Sparkles, Globe } from 'lucide-react';

// Currency list with symbols
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR', flag: '🇸🇦' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' }
];

// Mock exchange rates (in production, fetch from API like exchangerate-api.com)
const EXCHANGE_RATES = {
  'USD': 1,
  'EUR': 0.92,
  'GBP': 0.79,
  'INR': 83.12,
  'JPY': 149.50,
  'CNY': 7.24,
  'AUD': 1.53,
  'CAD': 1.39,
  'CHF': 0.88,
  'KRW': 1315.50,
  'SGD': 1.34,
  'HKD': 7.82,
  'AED': 3.67,
  'SAR': 3.75,
  'BRL': 4.98,
  'MXN': 17.15,
  'ZAR': 18.65,
  'RUB': 91.50,
  'TRY': 28.90,
  'THB': 35.20
};

const initialExpenses = [
  { id: 1, amount: 45.50, category: 'Dining Out', merchant: 'Starbucks', date: '2024-11-18', description: 'Morning coffee', currency: 'USD' },
  { id: 2, amount: 120.00, category: 'Groceries', merchant: 'Whole Foods', date: '2024-11-18', description: 'Weekly groceries', currency: 'USD' },
  { id: 3, amount: 35.00, category: 'Transport', merchant: 'Uber', date: '2024-11-17', description: 'Ride to office', currency: 'USD' },
  { id: 4, amount: 85.00, category: 'Dining Out', merchant: 'Italian Restaurant', date: '2024-11-16', description: 'Dinner', currency: 'USD' },
  { id: 5, amount: 200.00, category: 'Shopping', merchant: 'Amazon', date: '2024-11-15', description: 'Electronics', currency: 'USD' },
];

const initialBudget = {
  id: 'bud_1',
  totalAmount: 2000,
  categories: {
    'Dining Out': { allocated: 300, spent: 172.50 },
    'Groceries': { allocated: 500, spent: 270 },
    'Transport': { allocated: 300, spent: 125 },
    'Shopping': { allocated: 400, spent: 375 },
    'Entertainment': { allocated: 200, spent: 60 },
    'Others': { allocated: 300, spent: 0 }
  }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function ExpenseTracker() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [budget, setBudget] = useState(initialBudget);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [timeframe, setTimeframe] = useState('month');
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `👋 Hi! I'm your AI Financial Advisor. I've analyzed your spending in ${baseCurrency} and noticed you're 15% over budget in Dining Out. Want some tips?`, timestamp: new Date().toISOString() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Currency conversion helper
  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
    return amountInUSD * EXCHANGE_RATES[toCurrency];
  };

  // Format currency
  const formatCurrency = (amount, currencyCode = baseCurrency) => {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    return `${currency?.symbol || '$'}${amount.toFixed(2)}`;
  };

  // Calculate totals in base currency
  const totalSpent = expenses.reduce((sum, exp) => {
    const converted = convertCurrency(exp.amount, exp.currency, baseCurrency);
    return sum + converted;
  }, 0);

  const budgetRemaining = budget.totalAmount - totalSpent;
  const budgetUsedPercent = (totalSpent / budget.totalAmount) * 100;

  // Prepare chart data
  const categoryData = Object.entries(budget.categories).map(([cat, data]) => ({
    name: cat,
    spent: data.spent,
    allocated: data.allocated
  }));

  const spendingTrend = expenses
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((acc, exp) => {
      const date = exp.date;
      const convertedAmount = convertCurrency(exp.amount, exp.currency, baseCurrency);
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.amount += convertedAmount;
      } else {
        acc.push({ date, amount: convertedAmount });
      }
      return acc;
    }, []);

  const pieData = Object.entries(budget.categories)
    .map(([name, data]) => ({ name, value: data.spent }))
    .filter(item => item.value > 0);

  // AI Chat Handler
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { role: 'user', content: inputMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAIResponse(inputMessage);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response, 
        timestamp: new Date().toISOString() 
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (question) => {
    const q = question.toLowerCase();
    const currencySymbol = CURRENCIES.find(c => c.code === baseCurrency)?.symbol || '$';
    
    if (q.includes('save') || q.includes('tip')) {
      return `Based on your spending patterns in ${baseCurrency}:\n\n💡 Top 3 Savings Tips:\n\n1. **Dining Out (15% over budget)**: You spent ${currencySymbol}172.50 this month. Try meal prepping 2-3 times/week. Potential savings: ${currencySymbol}50-70/month\n\n2. **Shopping (94% of budget)**: You're close to your limit. Consider a 24-hour rule before purchases.\n\n3. **Transport**: Great job staying under budget! You're at ${currencySymbol}125/${currencySymbol}300 (42%)\n\n🎯 Combined potential savings: ${currencySymbol}90-110/month`;
    }
    
    if (q.includes('currency') || q.includes('convert')) {
      return `💱 Currency Information:\n\n• Your base currency: ${baseCurrency}\n• Available currencies: 20+ supported\n• Exchange rates updated daily\n\n💡 Click the 🌍 icon to change your base currency. All expenses will be automatically converted!`;
    }
    
    return `I understand you're asking about "${question}". Let me help!\n\n• Total Spent: ${formatCurrency(totalSpent)}\n• Budget Remaining: ${formatCurrency(budgetRemaining)}\n• You're using ${budgetUsedPercent.toFixed(0)}% of your budget in ${baseCurrency}\n\n💡 Would you like specific tips for any category?`;
  };

  const quickSuggestions = [
    "💬 Analyze my spending",
    "💡 Give me savings tips",
    "💱 Tell me about currencies",
    "🎯 Am I on track?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">ExpenseTracker Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Currency Selector */}
            <button 
              onClick={() => setShowCurrencyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition shadow-md"
            >
              <Globe className="w-4 h-4" />
              <span className="font-semibold">{baseCurrency}</span>
              <span className="text-xs opacity-80">
                {CURRENCIES.find(c => c.code === baseCurrency)?.flag}
              </span>
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Currency Info Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6" />
              <div>
                <p className="font-semibold">Displaying in {CURRENCIES.find(c => c.code === baseCurrency)?.name}</p>
                <p className="text-sm opacity-90">All expenses automatically converted • 20+ currencies supported</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{CURRENCIES.find(c => c.code === baseCurrency)?.symbol}{totalSpent.toFixed(2)}</p>
              <p className="text-xs opacity-80">Total Spent</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Spent</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            <p className="text-sm text-gray-500 mt-1">↑ 12% vs last month</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Budget Remaining</h3>
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(budgetRemaining)}</p>
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${budgetUsedPercent > 90 ? 'bg-red-500' : budgetUsedPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{budgetUsedPercent.toFixed(0)}% used</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/90 text-sm font-medium">AI Insights</h3>
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <p className="text-2xl font-bold">3 New Tips</p>
            <button 
              onClick={() => setChatOpen(true)}
              className="mt-3 text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              View Advisor →
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Spending Trends */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">📊 Spending Trends ({baseCurrency})</h2>
                <div className="flex gap-2">
                  {['day', 'week', 'month', 'year'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        timeframe === tf 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tf.charAt(0).toUpperCase() + tf.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={spendingTrend}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Budget vs Actual */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Budget vs Actual ({baseCurrency})</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="allocated" fill="#cbd5e1" name="Budget" />
                  <Bar dataKey="spent" fill="#3b82f6" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🍰 Category Breakdown</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Status */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Budget Status</h2>
              <div className="space-y-4">
                {Object.entries(budget.categories).map(([cat, data], idx) => {
                  const percent = (data.spent / data.allocated) * 100;
                  const status = percent > 100 ? 'over' : percent > 80 ? 'warning' : 'good';
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{cat}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(data.spent)} / {formatCurrency(data.allocated)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            status === 'over' ? 'bg-red-500' : 
                            status === 'warning' ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      {status === 'over' && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formatCurrency(data.spent - data.allocated)} over budget
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Selection Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Select Base Currency</h2>
                  <p className="text-sm opacity-90 mt-1">All expenses will be converted to this currency</p>
                </div>
                <button onClick={() => setShowCurrencyModal(false)} className="hover:bg-white/20 p-2 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CURRENCIES.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      setBaseCurrency(currency.code);
                      setShowCurrencyModal(false);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      baseCurrency === currency.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{currency.flag}</span>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">{currency.code}</p>
                        <p className="text-xs text-gray-600">{currency.symbol}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{currency.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Interface */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">AI Financial Advisor</h3>
                <p className="text-xs text-white/80">Currency: {baseCurrency}</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputMessage(sug.replace(/[💬💡💱🎯]/g, '').trim());
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center z-50"
        >
          <MessageSquare className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>
      )}
    </div>
  );
}

export default ExpenseTracker;
