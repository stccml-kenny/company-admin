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
  const [employees, setEmployees] = useState([]) // 員工預支列表
  const [advanceDetails, setAdvanceDetails] = useState([]) // 所有預支明細記錄
  const [balance, setBalance] = useState(0)
  const [view, setView] = useState('home') // 'home' | 'all' | 'advances' | 'salary'
  
  // 員工預支管理頁面的互動狀態
  const [newEmpName, setNewEmpName] = useState('')
  const [selectedEmpIdForAdvance, setSelectedEmpIdForAdvance] = useState('')
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0])
  const [advanceAmt, setAdvanceAmt] = useState('')
  const [advanceMethod, setAdvanceMethod] = useState('銀行轉賬')
  const [advanceRemark, setAdvanceRemark] = useState('')

  // 薪金支付版面的互動狀態
  const [salaryEmployee, setSalaryEmployee] = useState('')
  const [salaryAmount, setSalaryAmount] = useState('')
  const [salaryMethod, setSalaryMethod] = useState('銀行轉賬')
  const [salaryDate, setSalaryDate] = useState(new Date().toISOString().split('T')[0])
  const [salaryRemark, setSalaryRemark] = useState('')

  // 篩選與分頁狀態
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all') 
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all') 
  const [searchText, setSearchText] = useState('') // 商品/商戶名稱文字篩選
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 5

  // 批次選取狀態
  const [selectedIds, setSelectedIds] = useState([])

  // 獨立行內編輯狀態
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

  // 類別清單
  const incomeCategories = ['導師費', '材料費', '拍攝費用']
  const expenseCategories = ['交通', '飲食', '雜項', '娛樂', '投資', '薪資', '其他']

  const getDynamicCategoryFilterOptions = () => {
    if (selectedTypeFilter === 'income') return incomeCategories
    if (selectedTypeFilter === 'expense') return expenseCategories
    return Array.from(new Set([...incomeCategories, ...expenseCategories]))
  }

  const currentCategoryFilterOptions = getDynamicCategoryFilterOptions()

  // 載入交易記錄
  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('id', { ascending: false })
    
    if (error) {
      console.error('讀取記錄失敗:', error.message)
      return []
    }
    if (data) {
      setAllRecords(data)
      const total = data.reduce((acc, curr) => {
        return curr.type === 'income' ? acc + curr.amount : acc - curr.amount
      }, 0)
      setBalance(total)
      return data
    }
    return []
  }

  // 載入員工與預支明細
  const fetchData = async (currentRecords = allRecords) => {
    const { data: empData, error: empError } = await supabase
      .from('advances')
      .select('*')
      .order('employee_name', { ascending: true })

    const { data: detData, error: detError } = await supabase
      .from('advance_transactions')
      .select('*')
      .order('date', { ascending: false })

    if (!detError && detData) {
      setAdvanceDetails(detData)
    }

    if (!empError && empData) {
      const calculatedEmployees = empData.map(emp => {
        const empAdvances = (detData || []).filter(d => d.employee_id === emp.id)
        const totalInitial = empAdvances.reduce((sum, d) => sum + Number(d.amount), 0)

        const empDeductions = currentRecords.filter(r => r.type === 'expense' && r.is_reimbursed && r.reimburser === emp.employee_name)
        const totalDeducted = empDeductions.reduce((sum, r) => sum + Number(r.amount), 0)

        const finalBalance = Math.max(0, totalInitial - totalDeducted)

        return {
          ...emp,
          initial_amount: totalInitial,
          balance: finalBalance
        }
      })

      setEmployees(calculatedEmployees)
    }
  }

  // 更新數據按鈕：不僅更新數據，也讓頁面重新整理 (Refresh)
  const handleRefreshData = async () => {
    setIsLoading(true)
    const records = await fetchRecords()
    await fetchData(records)
    setIsLoading(false)
    window.location.reload()
  }

  useEffect(() => {
    const initData = async () => {
      const records = await fetchRecords()
      await fetchData(records)
    }
    initData()
  }, [])

  // 新增員工
  const handleAddEmployee = async (e) => {
    e.preventDefault()
    if (!newEmpName) {
      alert('請輸入員工姓名！')
      return
    }

    const { error } = await supabase
      .from('advances')
      .insert([{ employee_name: newEmpName, initial_amount: 0, balance: 0, status: 'active' }])

    if (error) {
      alert('新增員工失敗（可能已存在）：' + error.message)
    } else {
      alert(`✅ 成功新增員工：${newEmpName}`)
      setNewEmpName('')
      await fetchData()
    }
  }

  // 切換員工狀態
  const handleToggleEmployeeStatus = async (emp) => {
    const nextStatus = emp.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase
      .from('advances')
      .update({ status: nextStatus })
      .eq('id', emp.id)

    if (error) {
      alert('狀態更新失敗：' + error.message)
    } else {
      fetchData()
    }
  }

  // 新增預支資金明細
  const handleAddAdvanceTransaction = async (e) => {
    e.preventDefault()
    if (!selectedEmpIdForAdvance || !advanceAmt) {
      alert('請選擇員工並輸入預支金額！')
      return
    }

    const amt = parseFloat(advanceAmt)
    const emp = employees.find(e => e.id === selectedEmpIdForAdvance)
    if (!emp) return

    const { error: insError } = await supabase
      .from('advance_transactions')
      .insert([{
        employee_id: emp.id,
        date: advanceDate,
        amount: amt,
        method: advanceMethod,
        remark: advanceRemark
      }])

    if (insError) {
      alert('記錄預支失敗：' + insError.message)
      return
    }

    alert(`✅ 成功為 ${emp.employee_name} 記錄一筆預支資金 $${amt.toFixed(2)}`)
    setAdvanceAmt('')
    setAdvanceRemark('')
    
    const records = await fetchRecords()
    await fetchData(records)
  }

  // 刪除預支明細
  const handleDeleteAdvanceTransaction = async (det) => {
    if (!window.confirm('確定要刪除這筆預支記錄嗎？')) return

    const { error } = await supabase.from('advance_transactions').delete().eq('id', det.id)
    if (error) {
      alert('刪除失敗：' + error.message)
    } else {
      const records = await fetchRecords()
      await fetchData(records)
    }
  }

  // 提交支付薪金：保持在支付薪金版面，並將選擇員工、金額、發放方式、發放日期與備註全部還原至預設值
  const handlePaySalary = async (e) => {
    e.preventDefault()
    if (!salaryEmployee || !salaryAmount) {
      alert('請選擇員工並輸入薪金金額！')
      return
    }

    const numAmt = parseFloat(salaryAmount)
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          type: 'expense',
          amount: numAmt,
          category: '薪資',
          item_name: `支付薪金 - ${salaryEmployee}`,
          is_reimbursed: true,
          reimburser: salaryEmployee,
          reimbursement_method: salaryMethod,
          remark: salaryRemark || `發放薪金給 ${salaryEmployee}`,
          transaction_date: salaryDate
        }])

      if (error) throw error

      alert(`✅ 成功向 ${salaryEmployee} 支付薪金 $${numAmt.toFixed(2)}！`)
      
      // 還原所有輸入欄位至預設值
      setSalaryEmployee('')
      setSalaryAmount('')
      setSalaryMethod('銀行轉賬')
      setSalaryDate(new Date().toISOString().split('T')[0])
      setSalaryRemark('')
      
      const records = await fetchRecords()
      await fetchData(records)
    } catch (err) {
      alert('❌ 支付薪金失敗：' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 清空主畫面表單
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
    if (fileInputRef.current) fileInputRef.current.value = ''
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

    const numAmount = parseFloat(amount)

    if (type === 'expense' && isReimbursed && reimburser) {
      const emp = employees.find(e => e.employee_name === reimburser)
      if (emp) {
        if (emp.balance < numAmount) {
          alert(`⚠️ 該員工 (${reimburser}) 預支餘額不足！目前餘額：$${emp.balance.toFixed(2)}，本次報銷金額：$${numAmount.toFixed(2)}`)
          return
        }
      }
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

      const { error: insertError } = await supabase
        .from('transactions')
        .insert([{ 
          type, 
          amount: numAmount, 
          category,
          item_name: itemName,
          is_reimbursed: isReimbursed,
          account_method: (type === 'income' && isReimbursed) ? accountMethod : null,
          reimburser: (type === 'expense' && isReimbursed) ? reimburser : null,
          reimbursement_method: (type === 'expense' && isReimbursed) ? reimbursementMethod : null,
          remark: remark,
          transaction_date: transactionDate,
          receipt_url: receiptUrl 
        }])

      if (insertError) throw insertError

      const records = await fetchRecords()
      await fetchData(records)

      alert('✅ 記錄新增成功！')
      resetForm()
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
    if (error) {
      alert('刪除失敗：' + error.message)
    } else {
      const records = await fetchRecords()
      await fetchData(records)
    }
  }

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === currentRecords.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentRecords.map(r => r.id))
    }
  }

  const handleBatchReimbursed = async (status) => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`確定要將選取的 ${selectedIds.length} 筆記錄更新狀態嗎？`)) return

    for (const id of selectedIds) {
      const target = allRecords.find(r => r.id === id)
      if (target && target.type === 'expense') {
        await supabase.from('transactions').update({ is_reimbursed: status }).eq('id', target.id)
      }
    }

    alert('✅ 批次狀態更新完成！')
    setSelectedIds([])
    const records = await fetchRecords()
    await fetchData(records)
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`⚠️ 確定要刪除選取的 ${selectedIds.length} 筆記錄嗎？`)) return

    const { error } = await supabase.from('transactions').delete().in('id', selectedIds)
    if (error) {
      alert('批次刪除失敗：' + error.message)
    } else {
      alert('✅ 成功批次刪除！')
      setSelectedIds([])
      const records = await fetchRecords()
      await fetchData(records)
    }
  }

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

  const handleSaveInlineEdit = async (id) => {
    if (!inlineForm.amount || !inlineForm.category) {
      alert('金額與交易類別不能為空！')
      return
    }

    const newAmount = parseFloat(inlineForm.amount)

    setIsLoading(true)
    try {
      if (inlineForm.type === 'expense' && inlineForm.is_reimbursed && inlineForm.reimburser) {
        const newEmp = employees.find(e => e.employee_name === inlineForm.reimburser)
        if (newEmp) {
          const otherDeductions = allRecords
            .filter(r => r.id !== id && r.type === 'expense' && r.is_reimbursed && r.reimburser === newEmp.employee_name)
            .reduce((sum, r) => sum + Number(r.amount), 0)
          const availableBalance = newEmp.initial_amount - otherDeductions

          if (availableBalance < newAmount) {
            alert(`⚠️ 該員工 (${newEmp.employee_name}) 預支餘額不足！可用餘額：$${availableBalance.toFixed(2)}`)
            setIsLoading(false)
            return
          }
        }
      }

      const { error } = await supabase
        .from('transactions')
        .update({
          amount: newAmount,
          category: inlineForm.category,
          item_name: inlineForm.item_name,
          type: inlineForm.type,
          is_reimbursed: inlineForm.is_reimbursed,
          account_method: (inlineForm.type === 'income' && inlineForm.is_reimbursed) ? inlineForm.account_method : null,
          reimburser: (inlineForm.type === 'expense' && inlineForm.is_reimbursed) ? inlineForm.reimburser : null,
          reimbursement_method: (inlineForm.type === 'expense' && inlineForm.is_reimbursed) ? inlineForm.reimbursement_method : null,
          remark: inlineForm.remark,
          transaction_date: inlineForm.transaction_date
        })
        .eq('id', id)

      if (error) throw error

      alert('✅ 記錄更新成功！')
      setInlineEditingId(null)
      const records = await fetchRecords()
      await fetchData(records)
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

  const filteredRecords = allRecords.filter(record => {
    const matchCategory = selectedCategoryFilter === 'all' || record.category === selectedCategoryFilter
    const matchType = selectedTypeFilter === 'all' || record.type === selectedTypeFilter
    
    let matchStatus = true
    if (selectedStatusFilter === 'completed') {
      matchStatus = !!record.is_reimbursed
    } else if (selectedStatusFilter === 'pending') {
      matchStatus = !record.is_reimbursed
    }

    const matchSearch = !searchText || (record.item_name && record.item_name.toLowerCase().includes(searchText.toLowerCase())) || (record.remark && record.remark.toLowerCase().includes(searchText.toLowerCase()))

    return matchCategory && matchType && matchStatus && matchSearch
  })

  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage) || 1

  const accountMethodOptions = ['轉賬匯款', '銀行轉賬', '支票', '現金']
  const activeEmployees = employees.filter(e => e.status === 'active')

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
        
        {/* 頂部導覽切換與 Refresh 按鈕 */}
        <div className="flex flex-col gap-3 mb-6 border-b pb-3">
          <div className="flex justify-between items-center gap-1 flex-wrap">
            <div className="flex gap-1.5">
              <button 
                onClick={() => setView('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'home' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                記賬主畫面
              </button>
              <button 
                onClick={() => { setSelectedCategoryFilter('all'); setSelectedTypeFilter('all'); setSelectedStatusFilter('all'); setSearchText(''); setCurrentPage(1); setSelectedIds([]); setView('all'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                全部歷史
              </button>
            </div>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setView('salary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'salary' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
              >
                💰 支付薪金
              </button>
              <button 
                onClick={() => setView('advances')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'advances' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
              >
                👥 預支管理
              </button>
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

        {view === 'salary' ? (
          // ================= 支付薪金版面 =================
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">支付薪金管理</h1>
              <button 
                onClick={() => setView('home')}
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                ← 返回主畫面
              </button>
            </div>

            <form onSubmit={handlePaySalary} className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">選擇員工 <span className="text-red-500">*</span></label>
                <select 
                  value={salaryEmployee}
                  onChange={(e) => setSalaryEmployee(e.target.value)}
                  className="w-full border rounded p-2 text-sm bg-white outline-none"
                >
                  <option value="">請選擇員工</option>
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.employee_name}>{emp.employee_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">薪金金額 (HKD) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  className="w-full border rounded p-2 text-sm outline-none bg-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">發放方式</label>
                <select 
                  value={salaryMethod}
                  onChange={(e) => setSalaryMethod(e.target.value)}
                  className="w-full border rounded p-2 text-sm bg-white outline-none text-gray-700"
                >
                  {accountMethodOptions.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">發放日期</label>
                <input 
                  type="date" 
                  value={salaryDate}
                  onChange={(e) => setSalaryDate(e.target.value)}
                  className="w-full border rounded p-2 text-sm outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">備註</label>
                <input 
                  type="text" 
                  value={salaryRemark}
                  onChange={(e) => setSalaryRemark(e.target.value)}
                  className="w-full border rounded p-2 text-sm outline-none bg-white"
                  placeholder="例如：本月薪金發放（選填）"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-3 rounded-lg font-bold shadow"
              >
                {isLoading ? '處理中...' : '確認支付並記錄薪金'}
              </button>
            </form>
          </>
        ) : view === 'advances' ? (
          // ================= 員工預支資金管理面板 =================
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">員工預支資金管理</h1>
              <button 
                onClick={() => setView('home')}
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                ← 返回主畫面
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="bg-gray-50 p-3 rounded-lg border mb-4 space-y-2">
              <h2 className="text-xs font-bold text-gray-800">新增員工檔案</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="flex-1 border rounded p-1.5 text-xs outline-none bg-white"
                  placeholder="請輸入員工姓名"
                />
                <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-1.5 rounded font-bold">
                  新增員工
                </button>
              </div>
            </form>

            <form onSubmit={handleAddAdvanceTransaction} className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 mb-6 space-y-2.5">
              <h2 className="text-xs font-bold text-indigo-900">新增預支資金記錄</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">選擇員工</label>
                  <select 
                    value={selectedEmpIdForAdvance}
                    onChange={(e) => setSelectedEmpIdForAdvance(e.target.value)}
                    className="w-full border rounded p-1.5 text-xs bg-white outline-none"
                  >
                    <option value="">請選擇員工</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.employee_name} ({emp.status === 'active' ? '正常' : '已停用'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">日期</label>
                  <input 
                    type="date" 
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    className="w-full border rounded p-1.5 text-xs outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">預支金額 (HKD)</label>
                  <input 
                    type="number" 
                    value={advanceAmt}
                    onChange={(e) => setAdvanceAmt(e.target.value)}
                    className="w-full border rounded p-1.5 text-xs outline-none bg-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">預支方式</label>
                  <select 
                    value={advanceMethod}
                    onChange={(e) => setAdvanceMethod(e.target.value)}
                    className="w-full border rounded p-1.5 text-xs bg-white outline-none text-gray-700"
                  >
                    {accountMethodOptions.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">備註</label>
                <input 
                  type="text" 
                  value={advanceRemark}
                  onChange={(e) => setAdvanceRemark(e.target.value)}
                  className="w-full border rounded p-1.5 text-xs outline-none bg-white"
                  placeholder="備註說明（選填）"
                />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded font-bold shadow">
                記錄預支資金
              </button>
            </form>

            <h2 className="text-sm font-bold text-gray-800 mb-2">員工狀態與預支餘額</h2>
            <div className="space-y-2 mb-6">
              {employees.length === 0 ? (
                <p className="text-gray-500 text-center text-xs py-2">尚無員工檔案</p>
              ) : (
                employees.map(emp => (
                  <div key={emp.id} className="bg-gray-50 p-2.5 rounded border flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{emp.employee_name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {emp.status === 'active' ? '正常' : '已停用'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">累計預支：${emp.initial_amount.toFixed(2)} | 剩餘餘額：<strong className="text-indigo-600">${emp.balance.toFixed(2)}</strong></p>
                    </div>
                    <button 
                      onClick={() => handleToggleEmployeeStatus(emp)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold ${emp.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {emp.status === 'active' ? '停用' : '啟用'}
                    </button>
                  </div>
                ))
              )}
            </div>

            <h2 className="text-sm font-bold text-gray-800 mb-2">預支資金歷史明細記錄</h2>
            <div className="space-y-2">
              {advanceDetails.length === 0 ? (
                <p className="text-gray-500 text-center text-xs py-2">尚無預支明細</p>
              ) : (
                advanceDetails.map(det => {
                  const emp = employees.find(e => e.id === det.employee_id)
                  return (
                    <div key={det.id} className="bg-gray-50 p-2.5 rounded border flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-gray-800">{emp ? emp.employee_name : '未知員工'} - <span className="text-indigo-600 font-bold">${det.amount.toFixed(2)}</span> ({det.method})</p>
                        <p className="text-[10px] text-gray-500">{det.date} {det.remark ? `| 備註：${det.remark}` : ''}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteAdvanceTransaction(det)}
                        className="text-red-500 hover:text-red-700 text-[11px] font-semibold bg-red-50 px-2 py-1 rounded"
                      >
                        刪除
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </>
        ) : view === 'home' ? (
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
                              {emp.employee_name} {emp.status === 'active' ? `(預支餘額: $${emp.balance.toFixed(2)})` : '(已停用)'}
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
                    onClick={() => { setSelectedCategoryFilter('all'); setSelectedTypeFilter('all'); setSelectedStatusFilter('all'); setSearchText(''); setCurrentPage(1); setSelectedIds([]); setView('all'); }}
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
                            {record.type === 'income' ? (
                              record.is_reimbursed && (
                                <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  已入賬 {record.account_method ? `(${record.account_method})` : ''}
                                </span>
                              )
                            ) : (
                              record.is_reimbursed && (
                                <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  已報銷 {record.reimburser ? `[報銷者: ${record.reimburser}]` : ''} {record.reimbursement_method ? `(${record.reimbursement_method})` : ''}
                                </span>
                              )
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{record.transaction_date}</p>
                          {record.remark && <p className="text-xs text-gray-600 mt-0.5">備註：{record.remark}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className={`font-bold w-32 text-right ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {record.type === 'income' ? '+' : '-'}${Number(record.amount).toFixed(2)}
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setSelectedCategoryFilter('all'); setSelectedTypeFilter('all'); setSelectedStatusFilter('all'); setSearchText(''); setCurrentPage(1); setSelectedIds([]); setView('all'); handleStartInlineEdit(record); }}
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
        ) : (
          // ================= 全部歷史記錄頁面 =================
          <>
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => { setSelectedIds(); setInlineEditingId(null); setView('home'); }}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200"
              >
                ← 返回主畫面新增
              </button>
              <h1 className="text-xl font-bold text-gray-800">全部歷史記錄</h1>
              <div className="w-16"></div>
            </div>

            {/* 篩選控制列 (加入商品/商戶名稱文字篩選) */}
            <div className="mb-4 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
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
                  className="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none w-48 text-gray-700"
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
                <span className="text-xs font-bold text-blue-800">已選取 {selectedIds.length} 筆記錄</span>
                <button onClick={handleSelectAll} className="text-xs text-blue-600 underline font-semibold">
                  {selectedIds.length === currentRecords.length ? '取消本頁全選' : '本頁全選'}
                </button>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-blue-200">
                  <div className="flex gap-2">
                    <button onClick={() => handleBatchReimbursed(true)} className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded font-semibold">設為完成狀態</button>
                    <button onClick={() => handleBatchReimbursed(false)} className="flex-1 bg-gray-600 text-white text-xs py-1.5 rounded font-semibold">取消狀態</button>
                    <button onClick={handleBatchDelete} className="bg-red-500 text-white text-xs py-1.5 px-3 rounded font-semibold">刪除</button>
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
                    <div key={record.id} className={`p-3 rounded-lg border transition-colors flex flex-col gap-2 ${isChecked ? 'bg-blue-50 border-blue-300' : (isInlineEditing ? 'bg-amber-50/40 border-amber-300' : 'bg-gray-50 border-gray-100')}`}>
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
                                className="w-full border rounded p-1.5 text-xs outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 pt-4">
                              <input 
                                type="checkbox"
                                id={`inline-reimbursed-${record.id}`}
                                checked={inlineForm.is_reimbursed}
                                onChange={(e) => setInlineForm({ ...inlineForm, is_reimbursed: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded border"
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
                                className="w-full border rounded p-1.5 text-xs bg-white outline-none text-gray-700"
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
                                <select 
                                  value={inlineForm.reimburser}
                                  onChange={(e) => setInlineForm({ ...inlineForm, reimburser: e.target.value })}
                                  className="w-full border rounded p-1.5 text-xs bg-white outline-none text-gray-700"
                                >
                                  <option value="">請選擇報銷者</option>
                                  {employees.map(emp => (
                                    <option key={emp.id} value={emp.employee_name}>{emp.employee_name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">報銷方式</label>
                                <select 
                                  value={inlineForm.reimbursement_method}
                                  onChange={(e) => setInlineForm({ ...inlineForm, reimbursement_method: e.target.value })}
                                  className="w-full border rounded p-1.5 text-xs bg-white outline-none text-gray-700"
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
                              className="w-full border rounded p-1.5 text-sm outline-none"
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button onClick={() => handleSaveInlineEdit(record.id)} disabled={isLoading} className="flex-1 bg-amber-600 text-white text-xs py-2 rounded font-bold">儲存修改</button>
                            <button onClick={() => setInlineEditingId(null)} className="flex-1 bg-gray-200 text-gray-700 text-xs py-2 rounded font-bold">取消</button>
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
                                className="w-4 h-4 text-blue-600 rounded border cursor-pointer shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {record.category && (
                                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{record.category}</span>
                                  )}
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
                                        已報銷 {record.reimburser ? `[報銷者: ${record.reimburser}]` : ''} {record.reimbursement_method ? `(${record.reimbursement_method})` : ''}
                                      </span>
                                    )
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{record.transaction_date}</p>
                                {record.remark && <p className="text-xs text-gray-600 mt-0.5">備註：{record.remark}</p>}
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

                          <div className="flex justify-between items-center text-xs pl-7 pt-1">
                            {record.receipt_url ? (
                              <a href={record.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">查看收據相片 📷</a>
                            ) : (
                              <span className="text-gray-400">無收據</span>
                            )}
                            <button
                              onClick={() => {
                                setUploadingRecordId(record.id)
                                if (historyFileInputRef.current) historyFileInputRef.current.click()
                              }}
                              className="text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded"
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
              <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border rounded text-sm font-semibold disabled:opacity-40">← 上一頁</button>
                <span className="text-sm font-medium text-gray-600">第 {currentPage} 頁 / 共 {totalPages} 頁</span>
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border rounded text-sm font-semibold disabled:opacity-40">下一頁 →</button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}

export default App