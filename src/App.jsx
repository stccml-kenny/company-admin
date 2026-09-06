import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

function App() {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [itemName, setItemName] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [isReimbursed, setIsReimbursed] = useState(false)
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [allRecords, setAllRecords] = useState([])
  const [balance, setBalance] = useState(0)
  const [view, setView] = useState('home')
  const [editingId, setEditingId] = useState(null)
  
  // 篩選、分頁與批次選取狀態
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 5
  const [selectedIds, setSelectedIds] = useState([]) // 批次勾選的 ID 陣列
  const [batchCategory, setBatchCategory] = useState('') // 批次修改的類別

  const fileInputRef = useRef(null)

  // 可選的交易類別清單
  const categoryOptions = ['交通', '飲食', '雜項', '娛樂', '薪資', '投資', '其他']

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('id', { ascending: false })
    
    if (error) {
      console.error('讀取失敗:', error.message)
      return
    }
    if (data) {
      setAllRecords(data)
      const total = data.reduce((acc, curr) => {
        return curr.type === 'income' ? acc + curr.amount : acc - curr.amount
      }, 0)
      setBalance(total)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const handleEditClick = (record) => {
    setEditingId(record.id)
    setType(record.type || 'expense')
    setAmount(record.amount !== undefined ? record.amount : '')
    const matchedCategory = categoryOptions.includes(record.category) ? record.category : ''
    setCategory(matchedCategory)
    setItemName(record.item_name || '')
    setIsReimbursed(record.is_reimbursed || false)
    const cleanDate = record.transaction_date ? record.transaction_date.toString().split('T')[0] : new Date().toISOString().split('T')[0]
    setTransactionDate(cleanDate)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingId(null)
    setType('expense')
    setAmount('')
    setCategory('')
    setItemName('')
    setIsReimbursed(false)
    setTransactionDate(new Date().toISOString().split('T')[0])
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancelEdit = () => {
    resetForm()
  }

  const handleSubmit = async () => {
    if (!amount) {
      alert('請輸入金額！')
      return
    }
    if (!category) {
      alert('請選擇交易類別！')
      return
    }

    setIsLoading(true)
    
    try {
      let receiptUrl = null
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: publicURLData } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName)
        
        receiptUrl = publicURLData.publicUrl
      }

      if (editingId) {
        const updatePayload = { 
          type, 
          amount: parseFloat(amount), 
          category,
          item_name: itemName,
          is_reimbursed: isReimbursed,
          transaction_date: transactionDate 
        }
        if (receiptUrl) updatePayload.receipt_url = receiptUrl

        const { error } = await supabase
          .from('transactions')
          .update(updatePayload)
          .match({ id: editingId })

        if (error) throw error
        alert('✅ 記錄修改成功！')
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([{ 
            type, 
            amount: parseFloat(amount), 
            category,
            item_name: itemName,
            is_reimbursed: isReimbursed,
            transaction_date: transactionDate,
            receipt_url: receiptUrl 
          }])

        if (error) throw error
        alert('✅ 記錄新增成功！')
      }

      resetForm()
      fetchRecords() 
    } catch (error) {
      alert('❌ 發生錯誤：' + error.message)
      console.error('Submit Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這筆記錄嗎？')) return
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) alert('刪除失敗：' + error.message)
    else fetchRecords()
  }

  // 批次勾選單一項目
  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // 批次全選 / 取消全選（針對目前分頁或全部篩選資料）
  const handleSelectAll = () => {
    if (selectedIds.length === currentRecords.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentRecords.map(r => r.id))
    }
  }

  // 批次標記為已報銷 / 未報銷
  const handleBatchReimbursed = async (status) => {
    if (selectedIds.length === 0) return
    const actionText = status ? '標記為已報銷' : '取消報銷狀態'
    if (!window.confirm(`確定要將選取的 ${selectedIds.length} 筆記錄${actionText}嗎？`)) return

    const { error } = await supabase
      .from('transactions')
      .update({ is_reimbursed: status })
      .in('id', selectedIds)

    if (error) {
      alert('批次更新失敗：' + error.message)
    } else {
      alert(`✅ 成功批次${actionText}！`)
      setSelectedIds([])
      fetchRecords()
    }
  }

  // 批次更改類別
  const handleBatchCategoryChange = async () => {
    if (!batchCategory) {
      alert('請先選擇要批次變更的類別！')
      return
    }
    if (selectedIds.length === 0) return
    if (!window.confirm(`確定要將選取的 ${selectedIds.length} 筆記錄類別改為「${batchCategory}」嗎？`)) return

    const { error } = await supabase
      .from('transactions')
      .update({ category: batchCategory })
      .in('id', selectedIds)

    if (error) {
      alert('批次修改類別失敗：' + error.message)
    } else {
      alert('✅ 批次修改類別成功！')
      setSelectedIds([])
      setBatchCategory('')
      fetchRecords()
    }
  }

  // 批次刪除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`⚠️ 確定要刪除選取的 ${selectedIds.length} 筆記錄嗎？此動作無法復原！`)) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', selectedIds)

    if (error) {
      alert('批次刪除失敗：' + error.message)
    } else {
      alert('✅ 成功批次刪除選取記錄！')
      setSelectedIds([])
      fetchRecords()
    }
  }

  // 根據類別篩選資料
  const filteredRecords = selectedCategoryFilter === 'all' 
    ? allRecords 
    : allRecords.filter(record => record.category === selectedCategoryFilter)

  // 計算分頁資料
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage) || 1

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex justify-center items-start pt-10 pb-10">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden p-6">
        
        {view === 'home' ? (
          <>
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">公司記賬系統</h1>
            
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500">目前結餘</p>
              <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                HK$ {balance.toFixed(2)}
              </p>
            </div>
            
            <div className="space-y-4 mb-8">
              {editingId && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-xs text-amber-800 font-semibold">⚠️ 目前正在修改記錄 #{editingId}</span>
                  <button onClick={handleCancelEdit} className="text-xs text-red-600 underline font-bold">取消編輯</button>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setType('income')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-colors ${type === 'income' ? 'bg-green-500 text-white shadow' : 'bg-gray-100 text-gray-500'}`}
                >
                  入數 (收入)
                </button>
                <button 
                  onClick={() => setType('expense')}
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
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品 / 品名名稱</label>
                <input 
                  type="text" 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none"
                  placeholder="例如：地鐵車費、午餐、文具"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交易日期</label>
                <input 
                  type="date" 
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none text-gray-700"
                />
              </div>

              {/* 報銷狀態選項 */}
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
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

              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-full py-4 rounded-lg font-bold text-lg mt-2 shadow transition-colors text-white ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-opacity-50`}
              >
                {isLoading ? '處理中...' : (editingId ? '確認修改記錄' : '確認記錄')}
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">最新記錄 (最近5筆)</h2>
                {allRecords.length > 5 && (
                  <button 
                    onClick={() => { setSelectedCategoryFilter('all'); setCurrentPage(1); setSelectedIds([]); setView('all'); }}
                    className="text-sm text-blue-600 font-semibold hover:underline"
                  >
                    查看全部 →
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
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {record.category && (
                              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{record.category}</span>
                            )}
                            <span className="font-medium text-gray-800">{record.item_name || '未填寫品名'}</span>
                            {record.is_reimbursed && (
                              <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded">已報銷</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{record.transaction_date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`font-bold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {record.type === 'income' ? '+' : '-'}${record.amount}
                          </div>
                          <button 
                            onClick={() => handleEditClick(record)}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                          >
                            修改
                          </button>
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="text-red-400 hover:text-red-600 text-sm font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                      {record.receipt_url && (
                        <div>
                          <a href={record.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                            查看收據相片 📷
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              {allRecords.length > 5 && (
                <button 
                  onClick={() => { setSelectedCategoryFilter('all'); setCurrentPage(1); setSelectedIds([]); setView('all'); }}
                  className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  查看全部 {allRecords.length} 筆歷史記錄
                </button>
              )}
            </div>
          </>
        ) : (
          // ================= 全部記錄頁面 (支援批次操作) =================
          <>
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => { setSelectedIds([]); setView('home'); }}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                ← 返回主頁
              </button>
              <h1 className="text-xl font-bold text-gray-800">全部歷史記錄</h1>
              <div className="w-16"></div>
            </div>

            {/* 類別篩選器 */}
            <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="text-sm font-medium text-gray-700">類別篩選：</label>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value)
                  setCurrentPage(1)
                  setSelectedIds([])
                }}
                className="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none focus:border-blue-500 text-gray-700"
              >
                <option value="all">全部類別 ({allRecords.length})</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 批次操作控制列（僅在勾選項目時顯示） */}
            <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-blue-800">
                  已選取 {selectedIds.length} 筆記錄
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 underline font-semibold"
                >
                  {selectedIds.length === currentRecords.length ? '取消本頁全選' : '本頁全選'}
                </button>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-blue-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBatchReimbursed(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 px-2 rounded font-semibold transition-colors"
                    >
                      設為已報銷
                    </button>
                    <button
                      onClick={() => handleBatchReimbursed(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs py-1.5 px-2 rounded font-semibold transition-colors"
                    >
                      取消報銷
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3 rounded font-semibold transition-colors"
                    >
                      刪除
                    </button>
                  </div>

                  {/* 批次修改類別 */}
                  <div className="flex gap-2 items-center mt-1">
                    <select
                      value={batchCategory}
                      onChange={(e) => setBatchCategory(e.target.value)}
                      className="flex-1 border border-blue-300 rounded p-1 text-xs bg-white outline-none"
                    >
                      <option value="">批次改類別...</option>
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleBatchCategoryChange}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded font-semibold transition-colors"
                    >
                      確認更改
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {currentRecords.length === 0 ? (
                <p className="text-gray-500 text-center text-sm py-6">找不到符合此類別的記錄</p>
              ) : (
                currentRecords.map((record) => {
                  const isChecked = selectedIds.includes(record.id)
                  return (
                    <div 
                      key={record.id} 
                      className={`p-3 rounded-lg border transition-colors flex flex-col gap-2 ${isChecked ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-100'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {/* 批次選取勾選框 */}
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSelectOne(record.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {record.category && (
                                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{record.category}</span>
                              )}
                              <span className="font-medium text-gray-800">{record.item_name || '未填寫品名'}</span>
                              {record.is_reimbursed && (
                                <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded">已報銷</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{record.transaction_date}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={`font-bold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {record.type === 'income' ? '+' : '-'}${record.amount}
                          </div>
                          <button 
                            onClick={() => { setSelectedIds([]); setView('home'); handleEditClick(record); }}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                          >
                            修改
                          </button>
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="text-red-400 hover:text-red-600 text-sm font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                      {record.receipt_url && (
                        <div className="pl-7">
                          <a href={record.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                            查看收據相片 📷
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* 分頁按鈕控制列 */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-100"
                >
                  ← 上一頁
                </button>
                <span className="text-sm font-medium text-gray-600">
                  第 {currentPage} 頁 / 共 {totalPages} 頁
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-100"
                >
                  下一頁 →
                </button>
              </div>
            )}

            <button 
              onClick={() => { setSelectedIds([]); setView('home'); }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-center shadow hover:bg-blue-700 transition-colors"
            >
              返回主頁新增記錄
            </button>
          </>
        )}

      </div>
    </div>
  )
}

export default App