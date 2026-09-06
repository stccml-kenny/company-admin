import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

function App() {
  // 新增記錄用的主畫面狀態
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [itemName, setItemName] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [isReimbursed, setIsReimbursed] = useState(false)
  const [accountMethod, setAccountMethod] = useState('') // 入賬方式 (收入專用)
  const [reimburser, setReimburser] = useState('') // 報銷者 (支出專用)
  const [reimbursementMethod, setReimbursementMethod] = useState('') // 報銷方式 (支出專用)
  const [remark, setRemark] = useState('') // 備註
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [allRecords, setAllRecords] = useState([])
  const [balance, setBalance] = useState(0)
  const [view, setView] = useState('home') // 'home' 代表主畫面新增記錄，'all' 代表全部歷史記錄
  
  // 篩選與分頁狀態
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all') // 'all' | 'income' | 'expense'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all') // 'all' | 'completed' | 'pending'
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 5

  // 批次選取與批次修改狀態
  const [selectedIds, setSelectedIds] = useState([])
  const [batchCategory, setBatchCategory] = useState('')

  // 獨立行內編輯狀態 (key 為 record.id)
  const [inlineEditingId, setInlineEditingId] = useState(null)
  const [inlineForm, setInlineForm] = useState({
    amount: '',
    category: '',
    item_name: '',
    type: 'expense',
    is_reimbursed: false,
    account_method: '',
    reimburser: '',
    reimbursement_method: '',
    remark: '',
    transaction_date: ''
  })

  // 檔案上傳參照
  const fileInputRef = useRef(null)
  const historyFileInputRef = useRef(null)
  const [uploadingRecordId, setUploadingRecordId] = useState(null)

  // 定義收入與支出的專屬類別清單
  const incomeCategories = ['導師費', '材料費', '拍攝費用']
  const expenseCategories = ['交通', '飲食', '雜項', '娛樂', '投資', '薪資', '其他']

  // 根據當前選擇的「收支篩選 (selectedTypeFilter)」動態決定類別篩選可見的選項
  const getDynamicCategoryFilterOptions = () => {
    if (selectedTypeFilter === 'income') {
      return incomeCategories
    } else if (selectedTypeFilter === 'expense') {
      return expenseCategories
    } else {
      return Array.from(new Set([...incomeCategories, ...expenseCategories]))
    }
  }

  const currentCategoryFilterOptions = getDynamicCategoryFilterOptions()

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

  // 清空主畫面新增表單
  const resetForm = () => {
    setType('expense')
    setAmount('')
    setCategory('')
    setItemName('')
    setIsReimbursed(false)
    setAccountMethod('')
    setReimburser('')
    setReimbursementMethod('')
    setRemark('')
    setTransactionDate(new Date().toISOString().split('T')[0])
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 提交新增記錄
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

      const { error } = await supabase
        .from('transactions')
        .insert([{ 
          type, 
          amount: parseFloat(amount), 
          category,
          item_name: itemName,
          is_reimbursed: isReimbursed,
          account_method: type === 'income' ? accountMethod : null,
          reimburser: type === 'expense' ? reimburser : null,
          reimbursement_method: type === 'expense' ? reimbursementMethod : null,
          remark: remark,
          transaction_date: transactionDate,
          receipt_url: receiptUrl 
        }])

      if (error) throw error
      alert('✅ 記錄新增成功！')

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

  // 批次全選 / 取消全選
  const handleSelectAll = () => {
    if (selectedIds.length === currentRecords.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentRecords.map(r => r.id))
    }
  }

  // 批次標記狀態
  const handleBatchReimbursed = async (status) => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`確定要將選取的 ${selectedIds.length} 筆記錄更新狀態嗎？`)) return

    const { error } = await supabase
      .from('transactions')
      .update({ is_reimbursed: status })
      .in('id', selectedIds)

    if (error) {
      alert('批次更新失敗：' + error.message)
    } else {
      alert('✅ 成功批次更新狀態！')
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

  // 啟動歷史記錄中的行內直接編輯
  const handleStartInlineEdit = (record) => {
    setInlineEditingId(record.id)
    setInlineForm({
      amount: record.amount,
      category: record.category || '',
      item_name: record.item_name || '',
      type: record.type || 'expense',
      is_reimbursed: !!record.is_reimbursed,
      account_method: record.account_method || '',
      reimburser: record.reimburser || '',
      reimbursement_method: record.reimbursement_method || '',
      remark: record.remark || '',
      transaction_date: record.transaction_date ? record.transaction_date.toString().split('T')[0] : new Date().toISOString().split('T')[0]
    })
  }

  // 儲存行內直接編輯的結果
  const handleSaveInlineEdit = async (id) => {
    if (!inlineForm.amount || !inlineForm.category) {
      alert('金額與交易類別不能為空！')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(inlineForm.amount),
          category: inlineForm.category,
          item_name: inlineForm.item_name,
          type: inlineForm.type,
          is_reimbursed: inlineForm.is_reimbursed,
          account_method: inlineForm.type === 'income' ? inlineForm.account_method : null,
          reimburser: inlineForm.type === 'expense' ? inlineForm.reimburser : null,
          reimbursement_method: inlineForm.type === 'expense' ? inlineForm.reimbursement_method : null,
          remark: inlineForm.remark,
          transaction_date: inlineForm.transaction_date
        })
        .eq('id', id)

      if (error) throw error

      alert('✅ 記錄更新成功！')
      setInlineEditingId(null)
      fetchRecords()
    } catch (error) {
      alert('❌ 更新失敗：' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleHistoryFileUpload = async (e, recordId) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return

    setIsLoading(true)
    try {
      const fileExt = uploadedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, uploadedFile)

      if (uploadError) throw uploadError

      const { data: publicURLData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)
      
      const receiptUrl = publicURLData.publicUrl

      const { error: updateError } = await supabase
        .from('transactions')
        .update({ receipt_url: receiptUrl })
        .eq('id', recordId)

      if (updateError) throw updateError

      alert('✅ 收據上傳成功！')
      fetchRecords()
    } catch (error) {
      alert('❌ 上傳收據失敗：' + error.message)
    } finally {
      setIsLoading(false)
      if (historyFileInputRef.current) {
        historyFileInputRef.current.value = ''
      }
    }
  }

  // 過濾邏輯（包含收支、類別、狀態篩選）
  const filteredRecords = allRecords.filter(record => {
    const matchCategory = selectedCategoryFilter === 'all' || record.category === selectedCategoryFilter
    const matchType = selectedTypeFilter === 'all' || record.type === selectedTypeFilter
    
    let matchStatus = true
    if (selectedStatusFilter === 'completed') {
      matchStatus = !!record.is_reimbursed
    } else if (selectedStatusFilter === 'pending') {
      matchStatus = !record.is_reimbursed
    }

    return matchCategory && matchType && matchStatus
  })

  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage) || 1

  const accountMethodOptions = ['轉賬匯款', '銀行轉賬', '支票', '現金']

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex justify-center items-start pt-10 pb-10">
      <input 
        type="file"
        ref={historyFileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleHistoryFileUpload(e, uploadingRecordId)}
      />

      <div className="w-full max-w-lg bg-white rounded-xl shadow-md overflow-hidden p-6">
        
        {view === 'home' ? (
          // ================= 主畫面：專門用於輸入新交易 =================
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
                  className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none text-gray-700"
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
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">報銷者</label>
                    <input 
                      type="text" 
                      value={reimburser}
                      onChange={(e) => setReimburser(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:border-blue-500"
                      placeholder="請輸入報銷人姓名"
                    />
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
                    onClick={() => { setSelectedCategoryFilter('all'); setSelectedTypeFilter('all'); setSelectedStatusFilter('all'); setCurrentPage(1); setSelectedIds([]); setView('all'); }}
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
                            {/* 商品 / 商戶名稱設有 min-w-[5em] 確保至少顯示4-5個中文字寬度 */}
                            <span className="font-medium text-gray-800 min-w-[5em]">{record.item_name || '未填寫品名'}</span>
                            {record.type === 'income' ? (
                              record.is_reimbursed && (
                                <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  已入賬 {record.account_method ? `(${record.account_method})` : ''}
                                </span>
                              )
                            ) : (
                              record.is_reimbursed && (
                                <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  已報銷 {record.reimburser ? `[${record.reimburser}]` : ''} {record.reimbursement_method ? `(${record.reimbursement_method})` : ''}
                                </span>
                              )
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{record.transaction_date}</p>
                          {record.remark && <p className="text-xs text-gray-600 mt-0.5">備註：{record.remark}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`font-bold w-32 text-right ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {record.type === 'income' ? '+' : '-'}${Number(record.amount).toFixed(2)}
                          </div>
                          <button 
                            onClick={() => { setSelectedCategoryFilter('all'); setSelectedTypeFilter('all'); setSelectedStatusFilter('all'); setCurrentPage(1); setSelectedIds([]); setView('all'); handleStartInlineEdit(record); }}
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
                    </div>
                  ))
                )}
              </div>
              {allRecords.length > 5 && (
                <button 
                  onClick={() => { setSelectedCategoryFilter('all'); setSelectedTypeFilter('all'); setSelectedStatusFilter('all'); setCurrentPage(1); setSelectedIds([]); setView('all'); }}
                  className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  查看全部 {allRecords.length} 筆歷史記錄
                </button>
              )}
            </div>
          </>
        ) : (
          // ================= 全部歷史記錄頁面 =================
          <>
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => { setSelectedIds(); setInlineEditingId(null); setView('home'); }}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                ← 返回主畫面新增
              </button>
              <h1 className="text-xl font-bold text-gray-800">全部歷史記錄</h1>
              <div className="w-16"></div>
            </div>

            {/* 篩選控制列 */}
            <div className="mb-4 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">收支篩選：</label>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => {
                    setSelectedTypeFilter(e.target.value)
                    setSelectedCategoryFilter('all')
                    setSelectedStatusFilter('all')
                    setCurrentPage(1)
                    setSelectedIds([])
                    setInlineEditingId(null)
                  }}
                  className="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none focus:border-blue-500 text-gray-700 w-48"
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
                    className="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none focus:border-blue-500 text-gray-700 w-48"
                  >
                    <option value="all">全部狀態</option>
                    <option value="completed">{selectedTypeFilter === 'income' ? '已入賬' : '已報銷'}</option>
                    <option value="pending">{selectedTypeFilter === 'income' ? '未入賬' : '未報銷'}</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700">類別篩選：</label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => {
                    setSelectedCategoryFilter(e.target.value)
                    setCurrentPage(1)
                    setSelectedIds([])
                    setInlineEditingId(null)
                  }}
                  className="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none focus:border-blue-500 text-gray-700 w-48"
                >
                  <option value="all">全部類別</option>
                  {currentCategoryFilterOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 批次操作控制列 */}
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
                      設為完成狀態
                    </button>
                    <button
                      onClick={() => handleBatchReimbursed(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs py-1.5 px-2 rounded font-semibold transition-colors"
                    >
                      取消狀態
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3 rounded font-semibold transition-colors"
                    >
                      刪除
                    </button>
                  </div>

                  <div className="flex gap-2 items-center mt-1">
                    <select
                      value={batchCategory}
                      onChange={(e) => setBatchCategory(e.target.value)}
                      className="flex-1 border border-blue-300 rounded p-1 text-xs bg-white outline-none"
                    >
                      <option value="">批次改類別...</option>
                      {currentCategoryFilterOptions.map((cat) => (
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
                <p className="text-gray-500 text-center text-sm py-6">找不到符合條件的記錄</p>
              ) : (
                currentRecords.map((record) => {
                  const isChecked = selectedIds.includes(record.id)
                  const isInlineEditing = inlineEditingId === record.id

                  return (
                    <div 
                      key={record.id} 
                      className={`p-3 rounded-lg border transition-colors flex flex-col gap-2 ${isChecked ? 'bg-blue-50 border-blue-300' : (isInlineEditing ? 'bg-amber-50/40 border-amber-300' : 'bg-gray-50 border-gray-100')}`}
                    >
                      {isInlineEditing ? (
                        // ================= 行內編輯狀態 =================
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
                                className="w-full border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] text-gray-500 mb-0.5">交易類別 *</label>
                              <select 
                                value={inlineForm.category}
                                onChange={(e) => setInlineForm({ ...inlineForm, category: e.target.value })}
                                className="w-full border border-gray-300 rounded p-1.5 text-sm outline-none bg-white focus:border-blue-500"
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
                              className="w-full border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-blue-500"
                              placeholder="例如：導師費、教材材料費"
                            />
                          </div>

                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] text-gray-500 mb-0.5">交易日期</label>
                              <input 
                                type="date" 
                                value={inlineForm.transaction_date}
                                onChange={(e) => setInlineForm({ ...inlineForm, transaction_date: e.target.value })}
                                className="w-full border border-gray-300 rounded p-1.5 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 pt-4">
                              <input 
                                type="checkbox"
                                id={`inline-reimbursed-${record.id}`}
                                checked={inlineForm.is_reimbursed}
                                onChange={(e) => setInlineForm({ ...inlineForm, is_reimbursed: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                              />
                              <label htmlFor={`inline-reimbursed-${record.id}`} className="text-xs text-gray-700 cursor-pointer">
                                {inlineForm.type === 'income' ? '已入賬' : '已報銷'}
                              </label>
                            </div>
                          </div>

                          {inlineForm.type === 'income' ? (
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">入賬方式</label>
                              <select 
                                value={inlineForm.account_method}
                                onChange={(e) => setInlineForm({ ...inlineForm, account_method: e.target.value })}
                                className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white outline-none focus:border-green-500 text-gray-700"
                              >
                                <option value="">請選擇入賬方式</option>
                                {accountMethodOptions.map((method) => (
                                  <option key={method} value={method}>{method}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">報銷者</label>
                                <input 
                                  type="text" 
                                  value={inlineForm.reimburser}
                                  onChange={(e) => setInlineForm({ ...inlineForm, reimburser: e.target.value })}
                                  className="w-full border border-gray-300 rounded p-1.5 text-xs outline-none focus:border-blue-500"
                                  placeholder="報銷人姓名"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">報銷方式</label>
                                <select 
                                  value={inlineForm.reimbursement_method}
                                  onChange={(e) => setInlineForm({ ...inlineForm, reimbursement_method: e.target.value })}
                                  className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white outline-none focus:border-blue-500 text-gray-700"
                                >
                                  <option value="">請選擇報銷方式</option>
                                  {accountMethodOptions.map((method) => (
                                    <option key={method} value={method}>{method}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">備註</label>
                            <input 
                              type="text" 
                              value={inlineForm.remark}
                              onChange={(e) => setInlineForm({ ...inlineForm, remark: e.target.value })}
                              className="w-full border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-blue-500"
                              placeholder="備註事項"
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleSaveInlineEdit(record.id)}
                              disabled={isLoading}
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs py-2 rounded font-bold shadow transition-colors"
                            >
                              {isLoading ? '儲存中...' : '儲存修改'}
                            </button>
                            <button
                              onClick={() => setInlineEditingId(null)}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-2 rounded font-bold transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        // ================= 一般檢視狀態 =================
                        <>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 flex-1 pr-2">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSelectOne(record.id)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {record.category && (
                                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{record.category}</span>
                                  )}
                                  {/* 歷史記錄中的商品/商戶名稱設有 min-w-[5em] */}
                                  <span className="font-medium text-gray-800 min-w-[5em]">{record.item_name || '未填寫品名'}</span>
                                  {record.type === 'income' ? (
                                    record.is_reimbursed && (
                                      <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                        已入賬 {record.account_method ? `(${record.account_method})` : ''}
                                      </span>
                                    )
                                  ) : (
                                    record.is_reimbursed && (
                                      <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                        已報銷 {record.reimburser ? `[${record.reimburser}]` : ''} {record.reimbursement_method ? `(${record.reimbursement_method})` : ''}
                                      </span>
                                    )
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{record.transaction_date}</p>
                                {record.remark && <p className="text-xs text-gray-600 mt-0.5">備註：{record.remark}</p>}
                              </div>
                            </div>

                            {/* 金額固定寬度與靠右對齊，確保寬鬆顯示 +/- 00000.00 */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className={`font-bold w-32 text-right ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {record.type === 'income' ? '+' : '-'}${Number(record.amount).toFixed(2)}
                              </div>
                              <button 
                                onClick={() => handleStartInlineEdit(record)}
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

                          <div className="flex justify-between items-center text-xs pl-7 pt-1">
                            {record.receipt_url ? (
                              <a href={record.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                                查看收據相片 📷
                              </a>
                            ) : (
                              <span className="text-gray-400">無收據</span>
                            )}
                            <button
                              onClick={() => {
                                setUploadingRecordId(record.id)
                                if (historyFileInputRef.current) historyFileInputRef.current.click()
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2 py-1 rounded"
                            >
                              {record.receipt_url ? '更換收據' : '＋ 上傳收據'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* 分頁按鈕控制列 */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
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
          </>
        )}

      </div>
    </div>
  )
}

export default App