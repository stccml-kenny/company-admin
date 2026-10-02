import React from 'react'
import { incomeCategories, expenseCategories, accountMethodOptions } from '../../constants'

export default function HomeModule({
  type,
  setType,
  amount,
  setAmount,
  category,
  setCategory,
  itemName,
  setItemName,
  transactionDate,
  setTransactionDate,
  isReimbursed,
  setIsReimbursed,
  accountMethod,
  setAccountMethod,
  reimburser,
  setReimburser,
  employees,
  activeEmployees,
  reimbursementMethod,
  setReimbursementMethod,
  remark,
  setRemark,
  fileInputRef,
  setFile,
  handleSubmit,
  resetForm,
  isLoading,
  balance,
  allRecords,
  handleDelete,
  handleStartInlineEdit,
  setSelectedCategories,
  setSelectedTypeFilter,
  setSelectedStatusFilter,
  setSearchText,
  setStartDate,
  setEndDate,
  setCurrentPage,
  setSelectedIds,
  setView
}) {
  return (
          <>
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">公司記賬系統</h1>
            
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500">目前結餘</p>
              <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                HK$ {balance.toFixed(2)}
              </p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <button 
                  onClick={() => { setType('income'); setCategory(''); }}
                  className={`flex-1 py-3 rounded-lg font-bold transition-colors ${type === 'income' ? 'bg-green-500 text-white shadow' : 'bg-gray-100 text-gray-500'}`}
                >
                  入數 (收入)
                </button>
                <button 
                  onClick={() => { setType('expense'); setCategory(''); }}
                  className={`flex-1 py-3 rounded-lg font-bold transition-colors ${type === 'expense' ? 'bg-red-500 text-white shadow' : 'bg-gray-100 text-gray-500'}`}
                >
                  出數 (支出)
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額 (HKD)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-xl focus:border-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交易類別 <span className="text-red-500">*</span></label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none bg-white text-gray-700"
                >
                  <option value="" disabled>請選擇類別 (必選)</option>
                  {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品 / 商戶名稱</label>
                <input 
                  type="text" 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none"
                  placeholder="例如：導師費、教材材料費"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交易日期</label>
                <input 
                  type="date" 
                  value={transactionDate} 
                  onChange={(e) => setTransactionDate(e.target.value)} 
                  className="w-full max-w-[220px] box-border min-w-0 block border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none text-gray-700 [color-scheme:light]" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">上傳收據 / 發票相片</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {type === 'income' ? (
                <div className="space-y-3 bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isReimbursed"
                      checked={isReimbursed}
                      onChange={(e) => setIsReimbursed(e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <label htmlFor="isReimbursed" className="text-sm font-medium text-gray-700 cursor-pointer">
                      此筆交易已入賬
                    </label>
                  </div>

                  {isReimbursed && (
                    <div className="space-y-3 pt-2 border-t border-green-200">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">入賬方式</label>
                        <select 
                          value={accountMethod}
                          onChange={(e) => setAccountMethod(e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:border-green-500 text-gray-700"
                        >
                          <option value="">請選擇入賬方式</option>
                          {accountMethodOptions.map((method) => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">備註</label>
                        <input 
                          type="text" 
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:border-green-500"
                          placeholder="填寫其他備註事項（選填）"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isReimbursed"
                      checked={isReimbursed}
                      onChange={(e) => setIsReimbursed(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="isReimbursed" className="text-sm font-medium text-gray-700 cursor-pointer">
                      此筆交易已報銷
                    </label>
                  </div>

                  {isReimbursed && (
                    <div className="space-y-3 pt-2 border-t border-gray-200">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">報銷者（預支對消員工） <span className="text-red-500">*</span></label>
                        <select 
                          value={reimburser}
                          onChange={(e) => setReimburser(e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:border-blue-500 text-gray-700"
                        >
                          <option value="">請選擇報銷者</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.employee_name}>
                              {emp.employee_name} {emp.role ? `[${emp.role}]` : ''} (預支餘額: ${emp.balance.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">報銷方式</label>
                        <select 
                          value={reimbursementMethod}
                          onChange={(e) => setReimbursementMethod(e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:border-blue-500 text-gray-700"
                        >
                          <option value="">請選擇報銷方式</option>
                          {accountMethodOptions.map((method) => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">備註</label>
                        <input 
                          type="text" 
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:border-blue-500"
                          placeholder="填寫其他備註事項（選填）"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-4 rounded-lg font-bold text-lg mt-2 shadow transition-colors text-white bg-blue-600 hover:bg-blue-700 disabled:bg-opacity-50"
              >
                {isLoading ? '處理中...' : '確認記錄新交易'}
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">最新記錄 (最近5筆)</h2>
                {allRecords.length > 5 && (
                  <button 
                    onClick={() => { setSelectedCategories([]); setSelectedTypeFilter('all'); setSelectedStatusFilter('all'); setSearchText(''); setStartDate(''); setEndDate(''); setCurrentPage(1); setSelectedIds([]); setView('all'); }}
                    className="text-sm text-blue-600 font-semibold hover:underline"
                  >
                    查看全部歷史記錄 →
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {allRecords.length === 0 ? (
                  <p className="text-gray-500 text-center text-sm">目前尚無記錄</p>
                ) : (
                  allRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {record.category && (
                              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{record.category}</span>
                            )}
                            <span className="font-medium text-gray-800 min-w-[5em]">{record.item_name || '未填寫品名'}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{record.transaction_date}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className={`font-bold w-32 text-right ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {record.type === 'income' ? '+' : '-'}${Number(record.amount).toFixed(2)}
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setSelectedCategories([]); setSelectedTypeFilter('all'); setSelectedStatusFilter('all'); setSearchText(''); setStartDate(''); setEndDate(''); setCurrentPage(1); setSelectedIds([]); setView('all'); handleStartInlineEdit(record); }}
                              className="text-blue-500 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                            >
                              修改
                            </button>
                            <button 
                              onClick={() => handleDelete(record.id)}
                              className="text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                            >
                              刪除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
  )
}
