import React, { useState } from 'react';
import { Plus, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLeave, LeaveRequest, LeaveType } from '../contexts/LeaveContext';
import { useNotification } from '../contexts/NotificationContext';

const LeaveRequests: React.FC = () => {
  const { currentUser, isManager } = useAuth();
  const { userLeaveRequests, pendingLeaveRequests, createLeaveRequest, updateLeaveRequest } = useLeave();
  const { addNotification } = useNotification();
  
  const [formOpen, setFormOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ApprovalModal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState('');
  
  // Open the leave request form
  const openForm = () => {
    setFormOpen(true);
    setFormError('');
    
    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(tomorrow.toISOString().split('T')[0]);
  };
  
  // Close the leave request form
  const closeForm = () => {
    setFormOpen(false);
    setLeaveType('vacation');
    setStartDate('');
    setEndDate('');
    setReason('');
    setFormError('');
  };
  
  // Handle leave request submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Validate dates
    if (!startDate || !endDate) {
      setFormError('Please select both start and end dates');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      setFormError('End date cannot be before start date');
      return;
    }
    
    // Check if dates are in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) {
      setFormError('Start date cannot be in the past');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create the leave request
      await createLeaveRequest({
        userId: currentUser!.id,
        userName: currentUser!.name,
        userTeam: currentUser!.team,
        leaveType,
        startDate,
        endDate,
        reason,
      });
      
      // Add notification for manager
      addNotification({
        userId: '1', // Manager ID
        type: 'info',
        title: 'New Leave Request',
        message: `${currentUser!.name} has requested ${leaveType} leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
      });
      
      closeForm();
    } catch (error) {
      setFormError('An error occurred while submitting your request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Open the approval modal
  const openApprovalModal = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setModalOpen(true);
    setComment('');
  };
  
  // Close the approval modal
  const closeApprovalModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
    setComment('');
  };
  
  // Handle leave request approval/rejection
  const handleApprovalAction = async (approved: boolean) => {
    if (!selectedRequest) return;
    
    setLoading(true);
    
    try {
      // Update the leave request status
      await updateLeaveRequest(
        selectedRequest.id, 
        approved ? 'approved' : 'rejected',
        comment
      );
      
      // Add notification for the requestor
      addNotification({
        userId: selectedRequest.user_id,
        type: approved ? 'success' : 'info',
        title: 'Leave Request Update',
        message: `Your ${selectedRequest.leave_type} leave request for ${new Date(selectedRequest.start_date).toLocaleDateString()} to ${new Date(selectedRequest.end_date).toLocaleDateString()} has been ${approved ? 'approved' : 'rejected'}.${comment ? ` Comment: ${comment}` : ''}`,
      });
      
      closeApprovalModal();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Render user's leave requests
  const renderUserLeaveRequests = () => {
    if (userLeaveRequests.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>You have no leave requests</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comment
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {userLeaveRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`event-badge ${request.leave_type}`}>
                    {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(request.start_date).toLocaleDateString()} to {new Date(request.end_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round((new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`status-badge ${request.status}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {request.manager_comment || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render pending leave requests (for managers)
  const renderPendingLeaveRequests = () => {
    if (pendingLeaveRequests.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>No pending leave requests</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingLeaveRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <img 
                        className="h-8 w-8 rounded-full" 
                        src={`https://i.pravatar.cc/150?img=${parseInt(request.user_id)}`}
                        alt={request.user_name} 
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {request.user_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.user_team}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`event-badge ${request.leave_type}`}>
                    {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(request.start_date).toLocaleDateString()} to {new Date(request.end_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round((new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {request.reason || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openApprovalModal(request)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Leave Requests</h1>
        
        <button
          onClick={openForm}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Leave
        </button>
      </div>
      
      {/* Leave Request Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Request Leave</h3>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4">
                {formError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Type
                  </label>
                  <select
                    id="leaveType"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Brief description of your leave reason"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Approval Modal */}
      {modalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Review Leave Request</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Employee:</p>
                <p className="font-medium">{selectedRequest.user_name}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Leave Type:</p>
                <p className="font-medium">{selectedRequest.leave_type.charAt(0).toUpperCase() + selectedRequest.leave_type.slice(1)}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Dates:</p>
                <p className="font-medium">
                  {new Date(selectedRequest.start_date).toLocaleDateString()} to {new Date(selectedRequest.end_date).toLocaleDateString()}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({Math.round((new Date(selectedRequest.end_date).getTime() - new Date(selectedRequest.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s))
                  </span>
                </p>
              </div>
              
              {selectedRequest.reason && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Reason:</p>
                  <p>{selectedRequest.reason}</p>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                  Comment (Optional)
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Add a comment for the employee"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                onClick={closeApprovalModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApprovalAction(false)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleApprovalAction(true)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Manager Section */}
      {isManager() && (
        <div className="mb-8">
          <div className="mb-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-800 pb-2">Pending Approval</h2>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {renderPendingLeaveRequests()}
          </div>
        </div>
      )}
      
      {/* User's Leave Requests */}
      <div>
        <div className="mb-4 border-b border-gray-200">
          <h2 className="text-xl font-medium text-gray-800 pb-2">Your Leave History</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {renderUserLeaveRequests()}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequests;