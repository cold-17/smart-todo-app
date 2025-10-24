import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';

const ShareModal = ({ onClose }) => {
  const [sharedLists, setSharedLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { joinList, activeUsers, currentListId } = useSocket();

  useEffect(() => {
    fetchSharedLists();
  }, []);

  const fetchSharedLists = async () => {
    try {
      const response = await axios.get('/shared-lists');
      setSharedLists(response.data);
    } catch (err) {
      console.error('Failed to fetch shared lists:', err);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/shared-lists', { name: newListName.trim() });
      setSharedLists([response.data, ...sharedLists]);
      setNewListName('');
      setSuccess('List created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create list');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedList) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/shared-lists/${selectedList._id}/invite`, {
        email: inviteEmail.trim()
      });

      // Update the list in state
      setSharedLists(sharedLists.map(list =>
        list._id === selectedList._id ? response.data : list
      ));
      setSelectedList(response.data);
      setInviteEmail('');
      setSuccess('Invitation sent successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinList = (list) => {
    joinList(list._id);
    setSelectedList(list);
  };

  const handleRemoveMember = async (listId, userId) => {
    if (!window.confirm('Remove this member from the list?')) return;

    try {
      const response = await axios.delete(`/shared-lists/${listId}/members/${userId}`);
      setSharedLists(sharedLists.map(list =>
        list._id === listId ? response.data : list
      ));
      if (selectedList?._id === listId) {
        setSelectedList(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this shared list and all its todos? This cannot be undone.')) return;

    try {
      await axios.delete(`/shared-lists/${listId}`);
      setSharedLists(sharedLists.filter(list => list._id !== listId));
      if (selectedList?._id === listId) {
        setSelectedList(null);
      }
      setSuccess('List deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete list');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-stone-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Collaborate & Share</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create shared lists and invite team members
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Create & List */}
          <div className="space-y-6">
            {/* Create New List */}
            <div className="bg-stone-50 dark:bg-slate-800 rounded-xl p-4 border border-stone-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Create New List</h3>
              <form onSubmit={handleCreateList} className="space-y-3">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name (e.g., Team Project)"
                  className="w-full px-3 py-2 border border-stone-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !newListName.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Creating...' : 'Create List'}
                </button>
              </form>
            </div>

            {/* My Shared Lists */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">My Shared Lists</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sharedLists.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm">No shared lists yet</p>
                  </div>
                ) : (
                  sharedLists.map(list => (
                    <div
                      key={list._id}
                      onClick={() => handleJoinList(list)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedList?._id === list._id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                          : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{list.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Owner: {list.owner.username}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {list.members.length} member{list.members.length !== 1 ? 's' : ''}
                            </span>
                            {currentListId === `list:${list._id}` && (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: List Details & Invite */}
          <div className="space-y-6">
            {selectedList ? (
              <>
                {/* List Details */}
                <div className="bg-stone-50 dark:bg-slate-800 rounded-xl p-4 border border-stone-200 dark:border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedList.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Created by {selectedList.owner.username}
                      </p>
                    </div>
                    {selectedList.owner._id === selectedList.members.find(m => m.role === 'owner')?.user._id && (
                      <button
                        onClick={() => handleDeleteList(selectedList._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Active Users */}
                  {currentListId === `list:${selectedList._id}` && activeUsers.length > 0 && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">Active Now:</p>
                      <div className="flex flex-wrap gap-2">
                        {activeUsers.map(user => (
                          <div key={user.userId} className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-800 dark:text-green-200">{user.username}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Members List */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Members</h4>
                    <div className="space-y-2">
                      {selectedList.members.map(member => (
                        <div key={member.user._id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{member.user.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-stone-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-full">
                              {member.role}
                            </span>
                            {member.role !== 'owner' && selectedList.owner._id === selectedList.members.find(m => m.role === 'owner')?.user._id && (
                              <button
                                onClick={() => handleRemoveMember(selectedList._id, member.user._id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Invites */}
                  {selectedList.pendingInvites && selectedList.pendingInvites.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pending Invites</h4>
                      <div className="space-y-2">
                        {selectedList.pendingInvites.map((invite, idx) => (
                          <div key={idx} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">{invite.email}</p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">Invited by {invite.invitedBy?.username}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Invite Form */}
                {selectedList.owner._id === selectedList.members.find(m => m.role === 'owner')?.user._id && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Invite Member</h3>
                    <form onSubmit={handleInviteUser} className="space-y-3">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading || !inviteEmail.trim()}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                      >
                        {loading ? 'Inviting...' : 'Send Invitation'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center py-12">
                <div>
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-sm">Select a list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
