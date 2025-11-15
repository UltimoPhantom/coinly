'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users, Plus, X, Trash2, Undo2, Lock, Edit2, Save, Calculator } from 'lucide-react';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceUser, setBalanceUser] = useState('');
  const [tempBalanceUser, setTempBalanceUser] = useState('');
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [deletedExpense, setDeletedExpense] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showUndoButton, setShowUndoButton] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({
    addedBy: '',
    amount: '',
    location: '',
    usersPresent: [],
    payDone: false,
    password: ''
  });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
    fetchExpenses();
    
    // Load saved user preference
    const savedUser = localStorage.getItem('selectedUser');
    if (savedUser) {
      setSelectedUser(savedUser);
    }
  }, []);

  useEffect(() => {
    if (selectedUser && users.length > 0 && !users.includes(selectedUser)) {
      setSelectedUser('');
      localStorage.removeItem('selectedUser');
    }
  }, [users, selectedUser]);

  useEffect(() => {
    if (showUndoButton) {
      const timer = setTimeout(() => {
        setShowUndoButton(false);
        setDeletedExpense(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showUndoButton]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
    setLoading(false);
  };

  const handleUserSelection = (user) => {
    setSelectedUser(user);
    localStorage.setItem('selectedUser', user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !amount || !location) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addedBy: selectedUser,
          amount: parseFloat(amount),
          location,
          usersPresent: users,
          payDone: false
        })
      });

      if (res.ok) {
        setAmount('');
        setLocation('');
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
    }
    setSubmitting(false);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setEditForm({
      addedBy: expense.addedBy,
      amount: expense.amount.toString(),
      location: expense.location,
      usersPresent: expense.usersPresent || [],
      payDone: expense.payDone || false,
      password: ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (editForm.password !== 'CHAKKESH') {
      alert('Wrong password! Access denied.');
      return;
    }

    if (!editForm.addedBy || !editForm.amount || !editForm.location) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingExpense._id,
          addedBy: editForm.addedBy,
          amount: parseFloat(editForm.amount),
          location: editForm.location,
          usersPresent: editForm.usersPresent,
          payDone: editForm.payDone
        })
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingExpense(null);
        setEditForm({
          addedBy: '',
          amount: '',
          location: '',
          usersPresent: [],
          payDone: false,
          password: ''
        });
        fetchExpenses();
      } else {
        alert('Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Error updating expense');
    }
  };

  const toggleUserPresent = (user) => {
    setEditForm(prev => ({
      ...prev,
      usersPresent: prev.usersPresent.includes(user)
        ? prev.usersPresent.filter(u => u !== user)
        : [...prev.usersPresent, user]
    }));
  };

  const handleDelete = async (expense) => {
    setShowDeletePopup(true);
    setTimeout(() => setShowDeletePopup(false), 2000);
    
    try {
      const res = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expense._id })
      });

      if (res.ok) {
        setDeletedExpense(expense);
        setShowUndoButton(true);
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleUndo = async () => {
    if (!deletedExpense) return;

    try {
      const res = await fetch('/api/expenses/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deletedExpense)
      });

      if (res.ok) {
        setShowUndoButton(false);
        setDeletedExpense(null);
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error undoing delete:', error);
    }
  };

  const requestPasswordAction = (action) => {
    setPendingAction(action);
    setShowPasswordModal(true);
    setPassword('');
  };

  const handlePasswordSubmit = () => {
    if (password === 'CHAKKIMOS') {
      setShowPasswordModal(false);
      if (pendingAction?.type === 'add') {
        addUser();
      } else if (pendingAction?.type === 'remove') {
        removeUser(pendingAction.userName);
      }
      setPendingAction(null);
      setPassword('');
    } else {
      alert('kaam pe dyan de bosadi');
      setPassword('');
    }
  };

  const addUser = async () => {
    if (!newUserName.trim()) return;
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName.trim() })
      });

      if (res.ok) {
        setNewUserName('');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const removeUser = async (userName) => {
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName })
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const calculateBalances = (user) => {
    // Filter out expenses marked as payDone
    const activeExpenses = expenses.filter(exp => !exp.payDone);
    
    // Calculate what user owes to others
    const owes = {}; // { personName: amount }
    
    // Calculate what others owe to user
    const owedBy = {}; // { personName: amount }

    activeExpenses.forEach(expense => {
      const paidBy = expense.addedBy;
      const totalAmount = expense.amount;
      const peoplePresent = expense.usersPresent || [];
      
      if (peoplePresent.length === 0) return;
      
      const sharePerPerson = totalAmount / peoplePresent.length;
      
      // If user was present in this expense
      if (peoplePresent.includes(user)) {
        // User owes their share to the person who paid
        if (paidBy !== user) {
          owes[paidBy] = (owes[paidBy] || 0) + sharePerPerson;
        }
      }
      
      // If user paid for this expense
      if (paidBy === user) {
        // Each person present owes user their share
        peoplePresent.forEach(person => {
          if (person !== user) {
            owedBy[person] = (owedBy[person] || 0) + sharePerPerson;
          }
        });
      }
    });

    // Net balances (settling mutual debts)
    const netBalances = {};
    
    // Calculate net amounts
    const allPeople = new Set([...Object.keys(owes), ...Object.keys(owedBy)]);
    
    allPeople.forEach(person => {
      const userOwesToPerson = owes[person] || 0;
      const personOwesToUser = owedBy[person] || 0;
      const netAmount = personOwesToUser - userOwesToPerson;
      
      if (Math.abs(netAmount) > 0.01) { // Ignore very small amounts due to rounding
        netBalances[person] = netAmount;
      }
    });

    // Separate into what user owes and what user should receive
    const finalOwes = {};
    const finalReceives = {};
    
    Object.entries(netBalances).forEach(([person, amount]) => {
      if (amount < 0) {
        finalOwes[person] = Math.abs(amount);
      } else {
        finalReceives[person] = amount;
      }
    });

    // Get all expenses where user was involved (not paid done)
    const userExpenses = activeExpenses.filter(exp => 
      exp.usersPresent?.includes(user) || exp.addedBy === user
    );

    return {
      owes: finalOwes,
      receives: finalReceives,
      totalOwed: Object.values(finalOwes).reduce((sum, val) => sum + val, 0),
      totalReceivable: Object.values(finalReceives).reduce((sum, val) => sum + val, 0),
      expenses: userExpenses
    };
  };

  const openBalanceModal = () => {
    const savedUser = localStorage.getItem('selectedUser');
    if (savedUser && users.includes(savedUser)) {
      setTempBalanceUser(savedUser);
      setBalanceUser(savedUser);
      setShowBalanceModal(true);
    } else {
      setTempBalanceUser('');
      setBalanceUser('');
      setShowBalanceModal(true);
    }
  };

  const handleBalanceUserSelect = () => {
    if (tempBalanceUser) {
      setBalanceUser(tempBalanceUser);
    }
  };

  const balanceData = balanceUser ? calculateBalances(balanceUser) : null;

  const groupByDate = (expenses) => {
    const grouped = {};
    expenses.forEach(exp => {
      const date = new Date(exp.timestamp).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(exp);
    });
    return grouped;
  };

  const paginatedExpenses = expenses.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const groupedExpenses = groupByDate(paginatedExpenses);
  const totalPages = Math.ceil(expenses.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-4 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Expense Tracker</h1>
            <div className="flex gap-2">
              <button
                onClick={openBalanceModal}
                className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition active:scale-95"
                aria-label="Calculate balance"
              >
                <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              <button
                onClick={() => setShowUserModal(true)}
                className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition active:scale-95"
                aria-label="Manage users"
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Add Expense Form */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Who r u?
              </label>
              <select
                value={selectedUser}
                onChange={(e) => handleUserSelection(e.target.value)}
                className="w-full px-3 sm:px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                required
              >
                <option value="">Choose...</option>
                {users.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter Amount ₹
              </label>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 sm:px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                placeholder="4.20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Spent Where
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 sm:px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                placeholder="e.g., buying ganja"
                required
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedUser || !amount || !location}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
            >
              <Plus className="w-5 h-5" />
              {submitting ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Recent Expenses</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No expenses yet</div>
          ) : (
            <>
              {Object.entries(groupedExpenses).map(([date, dayExpenses]) => (
                <div key={date} className="mb-6">
                  <div className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 px-2">
                    {date}
                  </div>
                  <div className="space-y-2">
                    {dayExpenses.map((exp, idx) => (
                      <div
                        key={exp._id || idx}
                        className={`bg-gray-700 border rounded-lg p-3 sm:p-4 hover:bg-gray-650 transition group relative ${
                          exp.payDone ? 'border-green-600 opacity-60' : 'border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
                              {exp.addedBy}
                              {exp.payDone && (
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                                  Settled
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-base sm:text-lg font-bold text-indigo-400">
                              ₹{exp.amount.toFixed(2)}
                            </div>
                            <button
                              onClick={() => handleEdit(exp)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-600 rounded transition text-gray-400 hover:text-white"
                              title="Edit expense"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onDoubleClick={() => handleDelete(exp)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded transition text-gray-400 hover:text-white"
                              title="Double click to delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm sm:text-base text-gray-300 mb-1 break-words">
                          {exp.location}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(exp.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Balance Modal */}
      {/* Balance Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white">Balance Sheet</h3>
              <button
                onClick={() => {
                  setShowBalanceModal(false);
                  setBalanceUser('');
                  setTempBalanceUser('');
                }}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Button */}
            <button
              onClick={() => {
                setBalanceUser('__SUMMARY__');
              }}
              className="w-full mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition active:scale-98 flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              View Everyone's Summary
            </button>

            {/* User Selection */}
            {!balanceUser && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Your Name
                </label>
                <div className="flex gap-2">
                  <select
                    value={tempBalanceUser}
                    onChange={(e) => setTempBalanceUser(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Choose...</option>
                    {users.map(user => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBalanceUserSelect}
                    disabled={!tempBalanceUser}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    View
                  </button>
                </div>
              </div>
            )}

            {/* Everyone's Summary */}
            {balanceUser === '__SUMMARY__' && (
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-white mb-4">Everyone's Balance Summary</h4>
                
                {users.map(user => {
                  const userData = calculateBalances(user);
                  const netBalance = userData.totalReceivable - userData.totalOwed;
                  
                  return (
                    <div key={user} className={`border rounded-lg p-4 ${
                      netBalance > 0 
                        ? 'bg-green-900 bg-opacity-20 border-green-700' 
                        : netBalance < 0 
                        ? 'bg-red-900 bg-opacity-20 border-red-700'
                        : 'bg-gray-700 border-gray-600'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-lg font-bold text-white">{user}</div>
                        <div className={`text-xl font-bold ${
                          netBalance > 0 
                            ? 'text-green-400' 
                            : netBalance < 0 
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}>
                          {netBalance > 0 ? '+' : ''}₹{netBalance.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-400 mb-1">Owes:</div>
                          {Object.keys(userData.owes).length === 0 ? (
                            <div className="text-gray-500">Nothing</div>
                          ) : (
                            <div className="space-y-1">
                              {Object.entries(userData.owes).map(([person, amount]) => (
                                <div key={person} className="text-red-300">
                                  {person}: ₹{amount.toFixed(2)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <div className="text-gray-400 mb-1">Receives:</div>
                          {Object.keys(userData.receives).length === 0 ? (
                            <div className="text-gray-500">Nothing</div>
                          ) : (
                            <div className="space-y-1">
                              {Object.entries(userData.receives).map(([person, amount]) => (
                                <div key={person} className="text-green-300">
                                  {person}: ₹{amount.toFixed(2)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    setBalanceUser('');
                    setTempBalanceUser('');
                  }}
                  className="w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  Back to User Selection
                </button>
              </div>
            )}

            {/* Individual User Balance (existing code) */}
            {balanceUser && balanceUser !== '__SUMMARY__' && balanceData && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4">
                    <div className="text-sm text-red-300 mb-1">Total You Owe</div>
                    <div className="text-2xl font-bold text-red-400">
                      ₹{balanceData.totalOwed.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4">
                    <div className="text-sm text-green-300 mb-1">Total You'll Receive</div>
                    <div className="text-2xl font-bold text-green-400">
                      ₹{balanceData.totalReceivable.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Net Balance */}
                <div className={`${
                  balanceData.totalReceivable - balanceData.totalOwed >= 0 
                    ? 'bg-green-900 bg-opacity-30 border-green-700' 
                    : 'bg-red-900 bg-opacity-30 border-red-700'
                } border rounded-lg p-4`}>
                  <div className="text-sm text-gray-300 mb-1">Net Balance</div>
                  <div className={`text-2xl font-bold ${
                    balanceData.totalReceivable - balanceData.totalOwed >= 0 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {balanceData.totalReceivable - balanceData.totalOwed >= 0 ? '+' : ''}
                    ₹{(balanceData.totalReceivable - balanceData.totalOwed).toFixed(2)}
                  </div>
                </div>

                {/* What You Owe */}
                {Object.keys(balanceData.owes).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-red-400 mb-2">You Owe:</h4>
                    <div className="space-y-2">
                      {Object.entries(balanceData.owes).map(([person, amount]) => (
                        <div key={person} className="bg-gray-700 border border-gray-600 rounded-lg p-3 flex justify-between items-center">
                          <span className="text-white">{person}</span>
                          <span className="text-red-400 font-semibold">₹{amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* What You'll Receive */}
                {Object.keys(balanceData.receives).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-green-400 mb-2">You'll Receive:</h4>
                    <div className="space-y-2">
                      {Object.entries(balanceData.receives).map(([person, amount]) => (
                        <div key={person} className="bg-gray-700 border border-gray-600 rounded-lg p-3 flex justify-between items-center">
                          <span className="text-white">{person}</span>
                          <span className="text-green-400 font-semibold">₹{amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Related Expenses */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Your Expenses ({balanceData.expenses.length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {balanceData.expenses.length === 0 ? (
                      <div className="text-center text-gray-400 py-4">No expenses found</div>
                    ) : (
                      balanceData.expenses.map((exp, idx) => {
                        const shareAmount = exp.amount / (exp.usersPresent?.length || 1);
                        return (
                          <div key={exp._id || idx} className={`bg-gray-700 border rounded-lg p-3 ${
                            exp.payDone ? 'border-green-600 opacity-60' : 'border-gray-600'
                          }`}>
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <div className="text-sm font-semibold text-white flex items-center gap-2">
                                  {exp.addedBy} paid
                                  {exp.payDone && (
                                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                                      Settled
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">{exp.location}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-indigo-400">₹{exp.amount.toFixed(2)}</div>
                                <div className="text-xs text-gray-400">Your share: ₹{shareAmount.toFixed(2)}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(exp.timestamp).toLocaleDateString()} at {new Date(exp.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setBalanceUser('');
                    setTempBalanceUser('');
                  }}
                  className="w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  Change User
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 max-w-md w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white">Edit Expense</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingExpense(null);
                }}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Who Paid
            </label>
            <select
              value={editForm.addedBy}
              onChange={(e) => setEditForm({ ...editForm, addedBy: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose...</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Spent Where
            </label>
            <input
              type="text"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              People Present
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-700 p-3 rounded-lg border border-gray-600">
              {users.map(user => (
                <label key={user} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.usersPresent.includes(user)}
                    onChange={() => toggleUserPresent(user)}
                    className="w-4 h-4 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-white">{user}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.payDone}
                onChange={(e) => setEditForm({ ...editForm, payDone: e.target.checked })}
                className="w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-300">Pay Done?</span>
              <span className="text-xs text-gray-500">(Won't be counted in balance calculations)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password (CHAKKESH)
            </label>
            <input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleEditSubmit()}
              placeholder="Enter password"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleEditSubmit}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingExpense(null);
              }}
              className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Password Modal (for user management) */}
  {showPasswordModal && (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-6 h-6 text-indigo-400" />
          <h3 className="text-xl font-bold text-white">Enter Password</h3>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          placeholder="Enter password"
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handlePasswordSubmit}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 active:scale-95"
          >
            Submit
          </button>
          <button
            onClick={() => {
              setShowPasswordModal(false);
              setPendingAction(null);
              setPassword('');
            }}
            className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

  {/* User Management Modal */}
  {showUserModal && (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-white">Manage Users</h3>
          <button
            onClick={() => setShowUserModal(false)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-2 mb-4">
          {users.map((user, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-700 border border-gray-600 rounded-lg">
              <span className="text-sm sm:text-base text-white">{user}</span>
              <button
                onClick={() => requestPasswordAction({ type: 'remove', userName: user })}
                className="text-red-400 text-xs sm:text-sm px-3 py-1 hover:bg-red-600 hover:text-white rounded active:scale-95 transition"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newUserName.trim()) {
                requestPasswordAction({ type: 'add' });
              }
            }}
            placeholder="New user name"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-base"
          />
          <button
            onClick={() => requestPasswordAction({ type: 'add' })}
            disabled={!newUserName.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        <button
          onClick={() => setShowUserModal(false)}
          className="w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  )}

  {/* Delete Popup */}
  {showDeletePopup && (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-bounce">
      Delete kyu kiya bosadi! 😤
    </div>
  )}

  {/* Undo Button */}
  {showUndoButton && (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <button
        onClick={handleUndo}
        className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 active:scale-95 transition"
      >
        <Undo2 className="w-5 h-5" />
        Undo Delete
      </button>
    </div>
  )}
</div>
);
}
