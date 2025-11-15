'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users, Plus, X, Trash2, Undo2, Lock, Edit2, Save } from 'lucide-react';

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
    password: ''
  });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
    fetchExpenses();
    
    // Load saved user preference (always enabled by default)
    const savedUser = localStorage.getItem('selectedUser');
    if (savedUser) {
      setSelectedUser(savedUser);
    }
  }, []);

  useEffect(() => {
    // Check if saved user still exists in users list
    if (selectedUser && users.length > 0 && !users.includes(selectedUser)) {
      // User was removed, clear selection
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
    // Always save to localStorage (remember by default)
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
          usersPresent: users
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
          usersPresent: editForm.usersPresent
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
            <button
              onClick={() => setShowUserModal(true)}
              className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition active:scale-95"
              aria-label="Manage users"
            >
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>

          {/* Add Expense Form */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Your Name
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
                Enter Amount
              </label>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 sm:px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                placeholder="0.00"
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
                placeholder="e.g., Grocery Store"
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
                        className="bg-gray-700 border border-gray-600 rounded-lg p-3 sm:p-4 hover:bg-gray-650 transition group relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-white text-sm sm:text-base">
                            {exp.addedBy}
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