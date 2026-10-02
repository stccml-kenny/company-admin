import React from 'react'

export default function Navbar({
  view,
  setView,
  balance,
  isLoading,
  handleRefreshData,
  setSelectedCategories,
  setSelectedTypeFilter,
  setSelectedStatusFilter,
  setSearchText,
  setStartDate,
  setEndDate,
  setCurrentPage,
  setSelectedIds,
  setIsBatchEditing,
  setInlineEditingId,
  setEditingDocId,
  setDocType,
  setSelectedCustomerId,
  setIssuedBy,
  setDocRemark,
  setPaymentPercentage,
  setPaymentMethod,
  setPaymentRemark,
  setItems,
  setEditingCustId,
  setNewCustName,
  setNewCustContact,
  setNewCustEmail,
  setNewCustPhone,
  setNewCustAddress,
  setNewCustStatus
}) {
  return (
        <div className="flex flex-col gap-3 mb-6 border-b pb-3 no-print">
          <div className="flex justify-between items-center gap-1 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              <button 
                onClick={() => setView('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'home' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                記賬主畫面
              </button>
              <button 
                onClick={() => { setSelectedCategories([]); setSelectedTypeFilter('all'); setSelectedStatusFilter('all'); setSearchText(''); setStartDate(''); setEndDate(''); setCurrentPage(1); setSelectedIds([]); setIsBatchEditing(false); setView('all'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                全部歷史
              </button>
              <button 
                onClick={() => setView('documents')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'documents' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                單據記錄
              </button>
              <button 
                onClick={() => {
                  setEditingDocId(null)
                  setDocType('quotation')
                  setSelectedCustomerId('')
                  setIssuedBy('')
                  setDocRemark('')
                  setPaymentPercentage(100)
                  setPaymentMethod('銀行轉賬')
                  setPaymentRemark('')
                  setItems([{ item_name: '', quantity: 1, sessions: 1, unit_price: 0, isCustom: false }])
                  setView('createDoc')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'createDoc' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                + 建立單據
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={view === 'salary' || view === 'advances' || view === 'itemOptions' || view === 'customers' ? view : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    if (e.target.value === 'customers') {
                      setEditingCustId(null)
                      setNewCustName('')
                      setNewCustContact('')
                      setNewCustEmail('')
                      setNewCustPhone('')
                      setNewCustAddress('')
                      setNewCustStatus('active')
                    }
                    setView(e.target.value)
                  }
                }}
                className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer hover:bg-indigo-100 transition-colors"
              >
                <option value="" disabled>⚙️ 其他管理...</option>
                <option value="customers">👥 客戶管理</option>
                <option value="salary">💰 支付薪金</option>
                <option value="advances">👤 人事及資金管理</option>
                <option value="itemOptions">📋 項目說明管理</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleRefreshData}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {isLoading ? '更新中...' : '🔄 更新數據'}
            </button>
          </div>
        </div>
  )
}
