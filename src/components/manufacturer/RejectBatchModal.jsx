import React from 'react';

const RejectBatchModal = ({
  onSubmit,
  onCancel,
  selectedBatch,
  rejectionReason,
  setRejectionReason,
  error,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Reject Production Batch</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Batch:</span>{' '}
              {selectedBatch?.batchNumber}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Product:</span>{' '}
              {selectedBatch?.product?.name}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Quantity:</span>{' '}
              {selectedBatch?.quantity}
            </p>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="reason"
            >
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
              placeholder="Enter reason for rejecting this batch"
              required
            ></textarea>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              disabled={!rejectionReason}
            >
              Reject Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectBatchModal;
