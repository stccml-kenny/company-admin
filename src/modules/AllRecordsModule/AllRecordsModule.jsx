import React from 'react'
import { incomeCategories, expenseCategories, accountMethodOptions } from '../../constants'

export default function AllRecordsModule({
  allRecords,
  filteredRecords,
  currentRecords,
  selectedTypeFilter,
  setSelectedTypeFilter,
  selectedStatusFilter,
  setSelectedStatusFilter,
  currentCategoryFilterOptions,
  selectedCategories,
  setSelectedCategories,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  searchText,
  setSearchText,
  filteredTotalIncome,
  filteredTotalExpense,
  filteredNetBalance,
  selectedIds,
  setSelectedIds,
  handleSelectOne,
  handleSelectAll,
  selectedTotalIncome,
  selectedTotalExpense,
  selectedNetBalance,
  isBatchEditing,
  setIsBatchEditing,
  batchForm,
  setBatchForm,
  handleBatchUpdateSubmit,
  handleBatchDelete,
  inlineEditingId,
  setInlineEditingId,
  inlineForm,
  setInlineForm,
  handleStartInlineEdit,
  handleSaveInlineEdit,
  handleHistoryFileUpload,
  historyFileInputRef,
  setUploadingRecordId,
  handleDelete,
  currentPage,
  setCurrentPage,
  totalPages,
  recordsPerPage,
  setRecordsPerPage,
  employees,
  activeEmployees,
  isLoading,
  setView
}) {
  return (
          <>
            <div className="flex flex-col gap-2 mb-6">
              <div>
                <button 
                  onClick={() => { setSelectedIds([]); setIsBatchEditing(false); setInlineEditingId(null); setView('home'); }}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
                >
                  ← 返回主畫面新增
                </button>
              </div>
              <h1 className="text-xl font-bold text-gray-800 text-center">全部歷史記錄</h1>
            </div>

            {/* 篩選控制列 */}
            <div className="mb-4 space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">每頁顯示筆數：</label>
                <select
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                    setSelectedIds([])
                  }}
                  className="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none w-48 text-gray-700 font-bold"
                >
                  <option value={5}>5 筆</option>
                  <option value={10}>10 筆</option>
                  <option value={15}>15 筆</option>
                  <option value={20}>20 筆</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700">名稱關鍵字：</label>
                <input 
                  type="text"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value)
                    setCurrentPage(1)
                    setSelectedIds([])
                    setInlineEditingId(null)
                  }}
                  className="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none w-48 text-gray-700"
                  placeholder="輸入商品/商戶名稱..."
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700">開始日期：</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setCurrentPage(1)
                    setSelectedIds([])
                    setInlineEditingId(null)
                  }} 
                  className="border border-gray-300 rounded-lg p-2 text-xs bg-white outline-none box-border max-w-[55%] min-w-0 text-gray-700 [color-scheme:light]" 
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700">結束日期：</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setCurrentPage(1)
                    setSelectedIds([])
                    setInlineEditingId(null)
                  }} 
                  className="border border-gray-300 rounded-lg p-2 text-xs bg-white outline-none box-border max-w-[55%] min-w-0 text-gray-700 [color-scheme:light]" 
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700">收支篩選：</label>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => {
                    setSelectedTypeFilter(e.target.value)
                    setSelectedCategories([])
                    setSelectedStatusFilter('all')
                    setCurrentPage(1)
                    setSelectedIds([])
                    setInlineEditingId(null)
                  }}
                  className="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none w-48 text-gray-700"
                >
                  <option value="all">全部收支</option>
                  <option value="income">入數 (收入)</option>
                  <option value="expense">出數 (支出)</option>
                </select>
              </div>

              {selectedTypeFilter !== 'all' && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-700">
                    {selectedTypeFilter === 'income' ? '入賬狀態：' : '報銷狀態：'}
                  </label>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => {
                      setSelectedStatusFilter(e.target.value)
                      setCurrentPage(1)
                      setSelectedIds([])
                      setInlineEditingId(null)
                    }}
                    className="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none w-48 text-gray-700"
                  >
                    <option value="all">全部狀態</option>
                    <option value="completed">{selectedTypeFilter === 'income' ? '已入賬' : '已報銷'}</option>
                    <option value="pending">{selectedTypeFilter === 'income' ? '未入賬' : '未報銷'}</option>
                  </select>
                </div>
              )}

              {/* 類別多選篩選區塊 */}
              <div className="pt-2 border-t border-gray-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">類別篩選 (可多選)：</label>
                  {selectedCategories.length > 0 && (
                    <button 
                      onClick={() => setSelectedCategories([])} 
                      className="text-[11px] text-blue-600 underline font-semibold"
                    >
                      清除全部類別
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 bg-white p-2 rounded border">
                  {currentCategoryFilterOptions.map((cat) => {
                    const isChecked = selectedCategories.includes(cat)
                    return (
                      <label key={cat} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs cursor-pointer border transition-colors ${isChecked ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, cat])
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat))
                            }
                            setCurrentPage(1)
                          }}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                        />
                        {cat}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 統計資訊列 */}
            <div className="mb-4 bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs space-y-1">
              <div className="font-bold text-emerald-900 mb-1">📊 篩選結果加總統計（共 {filteredRecords.length} 筆記錄）：</div>
              <div className="flex justify-between text-emerald-800">
                <span>總收入：<strong className="text-green-600">+${filteredTotalIncome.toFixed(2)}</strong></span>
                <span>總支出：<strong className="text-red-600">-${filteredTotalExpense.toFixed(2)}</strong></span>
                <span>淨額：<strong className={filteredNetBalance >= 0 ? 'text-green-600' : 'text-red-600'}>${filteredNetBalance.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* 批次操作控制與已選取記錄加總統計 */}
            <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-800">已選取 {selectedIds.length} 筆記錄</span>
                <button onClick={handleSelectAll} className="text-xs text-blue-600 underline font-semibold">
                  {selectedIds.length === currentRecords.length ? '取消本頁全選' : '本頁全選'}
                </button>
              </div>

              {selectedIds.length > 0 && (
                <div className="bg-white border border-blue-200 p-2 rounded text-[11px] space-y-0.5 text-blue-900">
                  <div className="font-bold mb-0.5">📌 已選取記錄加總：</div>
                  <div className="flex justify-between">
                    <span>選取收入: <strong className="text-green-600">+${selectedTotalIncome.toFixed(2)}</strong></span>
                    <span>選取支出: <strong className="text-red-600">-${selectedTotalExpense.toFixed(2)}</strong></span>
                    <span>選取淨額: <strong className={selectedNetBalance >= 0 ? 'text-green-600' : 'text-red-600'}>${selectedNetBalance.toFixed(2)}</strong></span>
                  </div>
                </div>
              )}

              {selectedIds.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-blue-200">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsBatchEditing(!isBatchEditing)} 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 rounded font-semibold shadow"
                    >
                      {isBatchEditing ? '收起批次修改' : '⚙️ 批次修改報銷/入賬資料...'}
                    </button>
                    <button onClick={handleBatchDelete} className="bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3 rounded font-semibold">刪除</button>
                  </div>

                  {isBatchEditing && (
                    <div className="bg-white p-3 rounded-lg border border-indigo-200 space-y-2.5">
                      <h3 className="text-xs font-bold text-indigo-900">批次修改所選記錄資料：</h3>
                      
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox"
                          id="batch-is-reimbursed"
                          checked={batchForm.is_reimbursed}
                          onChange={(e) => setBatchForm({ ...batchForm, is_reimbursed: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border"
                        />
                        <label htmlFor="batch-is-reimbursed" className="text-xs text-gray-700 font-bold cursor-pointer">
                          設為完成狀態（已報銷 / 已入賬）
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">報銷者（預支員工）</label>
                          <select 
                            value={batchForm.reimburser}
                            onChange={(e) => setBatchForm({ ...batchForm, reimburser: e.target.value })}
                            className="w-full border rounded p-1.5 text-xs bg-white outline-none"
                          >
                            <option value="">(維持不變)</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.employee_name}>{emp.employee_name} {emp.role ? `[${emp.role}]` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">方式</label>
                          <select 
                            value={batchForm.reimbursement_method}
                            onChange={(e) => setBatchForm({ ...batchForm, reimbursement_method: e.target.value })}
                            className="w-full border rounded p-1.5 text-xs bg-white outline-none"
                          >
                            <option value="">(維持不變)</option>
                            {accountMethodOptions.map(m => (<option key={m} value={m}>{m}</option>))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">備註</label>
                        <input 
                          type="text" 
                          value={batchForm.remark}
                          onChange={(e) => setBatchForm({ ...batchForm, remark: e.target.value })}
                          placeholder="輸入新備註（留空則不修改原有備註）" 
                          className="w-full border rounded p-1.5 text-xs outline-none bg-white"
                        />
                      </div>

                      <button 
                        onClick={handleBatchUpdateSubmit}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded font-bold shadow"
                      >
                        {isLoading ? '更新中...' : '確認執行批次修改'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {currentRecords.length === 0 ? (
                <p className="text-gray-500 text-center text-sm py-6">找不到符合條件的記錄</p>
              ) : (
                currentRecords.map((record) => {
                  const isChecked = selectedIds.includes(record.id)
                  const isInlineEditing = inlineEditingId === record.id

                  return (
                    <div key={record.id} className={`p-3 rounded-lg border transition-colors flex flex-col gap-2 ${isChecked ? 'bg-blue-50 border-blue-300' : (isInlineEditing ? 'bg-amber-50/40 border-amber-300' : 'bg-gray-50 border-gray-100')}`}>
                      {isInlineEditing ? (
                        <div className="space-y-3 bg-white p-3 rounded-lg border border-amber-300">
                          <div className="flex justify-between items-center text-xs font-bold text-amber-800">
                            <span>✏️ 修改記錄 #{record.id.slice(0, 8)}</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setInlineForm({ ...inlineForm, type: 'income', category: '' })}
                              className={`flex-1 py-1.5 rounded text-xs font-bold ${inlineForm.type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                            >
                              收入
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineForm({ ...inlineForm, type: 'expense', category: '' })}
                              className={`flex-1 py-1.5 rounded text-xs font-bold ${inlineForm.type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                            >
                              支出
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] text-gray-500 mb-0.5">金額 (HKD)</label>
                              <input 
                                type="number" 
                                value={inlineForm.amount}
                                onChange={(e) => setInlineForm({ ...inlineForm, amount: e.target.value })}
                                className="w-full border rounded p-1.5 text-sm outline-none"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] text-gray-500 mb-0.5">交易類別 *</label>
                              <select 
                                value={inlineForm.category}
                                onChange={(e) => setInlineForm({ ...inlineForm, category: e.target.value })}
                                className="w-full border rounded p-1.5 text-sm outline-none bg-white"
                              >
                                <option value="" disabled>請選擇</option>
                                {(inlineForm.type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">商品 / 商戶名稱</label>
                            <input 
                              type="text" 
                              value={inlineForm.item_name}
                              onChange={(e) => setInlineForm({ ...inlineForm, item_name: e.target.value })}
                              className="w-full border rounded p-1.5 text-sm outline-none"
                            />
                          </div>

                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] text-gray-500 mb-0.5">交易日期</label>
                              <input 
                                type="date" 
                                value={inlineForm.transaction_date} 
                                onChange={(e) => setInlineForm({ ...inlineForm, transaction_date: e.target.value })} 
                                className="w-full max-w-[220px] box-border min-w-0 block border rounded p-1.5 text-xs outline-none bg-white [color-scheme:light]" 
                              />
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="checkbox"
                                id={`inline-reimbursed-${record.id}`}
                                checked={inlineForm.is_reimbursed}
                                onChange={(e) => setInlineForm({ ...inlineForm, is_reimbursed: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded border"
                              />
                              <label htmlFor={`inline-reimbursed-${record.id}`} className="text-xs text-gray-700 cursor-pointer font-bold">
                                {inlineForm.type === 'income' ? '此筆交易已入賬' : '此筆交易已報銷'}
                              </label>
                            </div>

                            {inlineForm.is_reimbursed && (
                              <div className="space-y-2 pl-2 border-l-2 border-blue-400">
                                {inlineForm.type === 'income' ? (
                                  <div>
                                    <label className="block text-[10px] text-gray-500 mb-0.5">入賬方式</label>
                                    <select 
                                      value={inlineForm.account_method}
                                      onChange={(e) => setInlineForm({ ...inlineForm, account_method: e.target.value })}
                                      className="w-full border rounded p-1.5 text-xs bg-white outline-none"
                                    >
                                      <option value="">請選擇入賬方式</option>
                                      {accountMethodOptions.map(m => (<option key={m} value={m}>{m}</option>))}
                                    </select>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <label className="block text-[10px] text-gray-500 mb-0.5">報銷者（預支員工）</label>
                                      <select 
                                        value={inlineForm.reimburser}
                                        onChange={(e) => setInlineForm({ ...inlineForm, reimburser: e.target.value })}
                                        className="w-full border rounded p-1.5 text-xs bg-white outline-none"
                                      >
                                        <option value="">請選擇報銷者</option>
                                        {employees.map(emp => (
                                          <option key={emp.id} value={emp.employee_name}>{emp.employee_name} {emp.role ? `[${emp.role}]` : ''}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-gray-500 mb-0.5">報銷方式</label>
                                      <select 
                                        value={inlineForm.reimbursement_method}
                                        onChange={(e) => setInlineForm({ ...inlineForm, reimbursement_method: e.target.value })}
                                        className="w-full border rounded p-1.5 text-xs bg-white outline-none"
                                      >
                                        <option value="">請選擇報銷方式</option>
                                        {accountMethodOptions.map(m => (<option key={m} value={m}>{m}</option>))}
                                      </select>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">備註</label>
                              <input 
                                type="text" 
                                value={inlineForm.remark}
                                onChange={(e) => setInlineForm({ ...inlineForm, remark: e.target.value })}
                                className="w-full border rounded p-1.5 text-xs outline-none"
                                placeholder="備註（選填）"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button onClick={() => handleSaveInlineEdit(record.id)} disabled={isLoading} className="flex-1 bg-amber-600 text-white text-xs py-2 rounded font-bold">儲存修改</button>
                            <button onClick={() => setInlineEditingId(null)} className="flex-1 bg-gray-200 text-gray-700 text-xs py-2 rounded font-bold">取消</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 flex-1 pr-2">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSelectOne(record.id)}
                                className="w-4 h-4 text-blue-600 rounded border cursor-pointer shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {record.category && (
                                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{record.category}</span>
                                  )}
                                  <span className="font-medium text-gray-800 min-w-[5em]">{record.item_name || '未填寫品名'}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${record.is_reimbursed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {record.type === 'income' ? (record.is_reimbursed ? '已入賬' : '未入賬') : (record.is_reimbursed ? '已報銷' : '未報銷')}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {record.transaction_date}
                                  {(record.reimburser || record.advance_deduction_employee) && ` | 報銷者: ${record.reimburser || record.advance_deduction_employee}`}
                                  {(record.reimbursement_method || record.account_method) && ` | 方式: ${record.reimbursement_method || record.account_method}`}
                                  {record.remark && ` | 備註: ${record.remark}`}
                                </p>
                                
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                  {record.receipt_url ? (
                                    <a 
                                      href={record.receipt_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                                    >
                                      📷 查看收據
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-gray-400">無收據</span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setUploadingRecordId(record.id)
                                      if (historyFileInputRef.current) {
                                        historyFileInputRef.current.click()
                                      }
                                    }}
                                    className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium border"
                                  >
                                    {record.receipt_url ? '更換收據' : '+ 上傳收據'}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <div className={`font-bold w-32 text-right ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {record.type === 'income' ? '+' : '-'}${Number(record.amount).toFixed(2)}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleStartInlineEdit(record)} className="text-blue-500 text-xs font-medium px-2 py-1 rounded bg-blue-50">修改</button>
                                <button onClick={() => handleDelete(record.id)} className="text-red-400 text-xs font-medium px-2 py-1 rounded bg-red-50">刪除</button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border">
                <button onClick={() => { setCurrentPage((prev) => Math.max(prev - 1, 1)); setSelectedIds([]); }} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border rounded text-sm font-semibold disabled:opacity-40">← 上一頁</button>
                <span className="text-sm font-medium text-gray-600">第 {currentPage} 頁 / 共 {totalPages} 頁</span>
                <button onClick={() => { setCurrentPage((prev) => Math.min(prev + 1, totalPages)); setSelectedIds([]); }} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border rounded text-sm font-semibold disabled:opacity-40">下一頁 →</button>
              </div>
            )}
          </>
  )
}
