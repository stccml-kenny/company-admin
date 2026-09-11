import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

function App() {
  const [view, setView] = useState('home') 

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [itemName, setItemName] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [isReimbursed, setIsReimbursed] = useState(false)
  const [accountMethod, setAccountMethod] = useState('') 
  const [reimburser, setReimburser] = useState('') 
  const [reimbursementMethod, setReimbursementMethod] = useState('') 
  const [remark, setRemark] = useState('') 
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [allRecords, setAllRecords] = useState([])
  const [employees, setEmployees] = useState([]) 
  const [advanceDetails, setAdvanceDetails] = useState([]) 
  const [balance, setBalance] = useState(0)

  const [documents, setDocuments] = useState([])
  const [customers, setCustomers] = useState([])
  const [docType, setDocType] = useState('quotation')
  const [docNumber, setDocNumber] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [issuedBy, setIssuedBy] = useState('') 
  const [docRemark, setDocRemark] = useState('')
  
  const [paymentPercentage, setPaymentPercentage] = useState(100)
  const [paymentMethod, setPaymentMethod] = useState('銀行轉賬')
  const [paymentRemark, setPaymentRemark] = useState('')

  const [items, setItems] = useState([{ item_name: '', quantity: 1, sessions: 1, unit_price: 0, isCustom: false }])
  const [selectedPrintDoc, setSelectedPrintDoc] = useState(null)
  const [editingDocId, setEditingDocId] = useState(null)

  // 單據記錄篩選 Filter State
  const [docFilterType, setDocFilterType] = useState('all')
  const [docFilterStatus, setDocFilterStatus] = useState('all')
  const [docFilterCustomerId, setDocFilterCustomerId] = useState('all')
  const [docFilterSearch, setDocFilterSearch] = useState('')
  const [docFilterStartDate, setDocFilterStartDate] = useState('')
  const [docFilterEndDate, setDocFilterEndDate] = useState('')

  const [commonItemOptions, setCommonItemOptions] = useState([])
  const [newItemOptionName, setNewItemOptionName] = useState('')
  const [editingItemOptionId, setEditingItemOptionId] = useState(null)
  const [editingItemOptionName, setEditingItemOptionName] = useState('')

  const [editingCustId, setEditingCustId] = useState(null)
  const [newCustName, setNewCustName] = useState('')
  const [newCustContact, setNewCustContact] = useState('')
  const [newCustEmail, setNewCustEmail] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustAddress, setNewCustAddress] = useState('')
  const [newCustStatus, setNewCustStatus] = useState('active')

  // 員工檔案建立
  const [newEmpName, setNewEmpName] = useState('')
  const [newEmpRole, setNewEmpRole] = useState('')

  // 員工檔案（姓名 / 崗位）行內編輯 State
  const [editingEmpId, setEditingEmpId] = useState(null)
  const [editingEmpForm, setEditingEmpForm] = useState({ employee_name: '', role: '' })

  // 預支建立
  const [selectedEmpIdForAdvance, setSelectedEmpIdForAdvance] = useState('')
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0])
  const [advanceAmt, setAdvanceAmt] = useState('')
  const [advanceMethod, setAdvanceMethod] = useState('銀行轉賬')
  const [advanceRemark, setAdvanceRemark] = useState('')

  // 預支明細紀錄行內編輯 State
  const [editingAdvanceTxId, setEditingAdvanceTxId] = useState(null)
  const [editingAdvanceTxForm, setEditingAdvanceTxForm] = useState({
    employee_id: '',
    date: '',
    amount: '',
    method: '銀行轉賬',
    remark: ''
  })

  // 人事及資金管理伸縮 State
  const [isEmployeesExpanded, setIsEmployeesExpanded] = useState(true)
  const [isAdvanceHistoryExpanded, setIsAdvanceHistoryExpanded] = useState(false)

  const [salaryEmployee, setSalaryEmployee] = useState('')
  const [salaryAmount, setSalaryAmount] = useState('')
  const [salaryMethod, setSalaryMethod] = useState('')
  const [salaryDate, setSalaryDate] = useState(new Date().toISOString().split('T')[0])
  const [salaryRemark, setSalaryRemark] = useState('')

  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all') 
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all') 
  const [searchText, setSearchText] = useState('') 
  const [startDate, setStartDate] = useState('') 
  const [endDate, setEndDate] = useState('') 
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(5)

  const [selectedIds, setSelectedIds] = useState([])

  const [isBatchEditing, setIsBatchEditing] = useState(false)
  const [batchForm, setBatchForm] = useState({
    is_reimbursed: true,
    reimburser: '',
    reimbursement_method: '',
    remark: ''
  })

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

  const fileInputRef = useRef(null)
  const historyFileInputRef = useRef(null)
  const [uploadingRecordId, setUploadingRecordId] = useState(null)

  const incomeCategories = ['導師費', '材料費', '拍攝費用']
  const expenseCategories = ['交通', '飲食', '雜項', '娛樂', '投資', '薪資', '其他']

  const getDynamicCategoryFilterOptions = () => {
    if (selectedTypeFilter === 'income') return incomeCategories
    if (selectedTypeFilter === 'expense') return expenseCategories
    return Array.from(new Set([...incomeCategories, ...expenseCategories]))
  }

  const currentCategoryFilterOptions = getDynamicCategoryFilterOptions()

  const generateDocNumber = async (typeVal, dateVal, existingDocs = documents) => {
    const prefix = typeVal === 'quotation' ? 'QT' : 'INV'
    const dateStr = dateVal.replace(/-/g, '') 
    const pattern = `${prefix}-${dateStr}-`

    const sameDayDocs = existingDocs.filter(d => d.doc_number && d.doc_number.startsWith(pattern))
    const nextSeq = sameDayDocs.length + 1
    const seqStr = String(nextSeq).padStart(3, '0')

    return `${prefix}-${dateStr}-${seqStr}`
  }

  useEffect(() => {
    const updateNum = async () => {
      if (!editingDocId) {
        const num = await generateDocNumber(docType, issueDate, documents)
        setDocNumber(num)
      }
    }
    updateNum()
  }, [docType, issueDate, documents, editingDocId])

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

  const fetchItemOptions = async () => {
    const { data, error } = await supabase
      .from('item_options')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('讀取項目說明失敗:', error.message)
    } else if (data) {
      setCommonItemOptions(data)
    }
  }

  const fetchData = async (currentRecords = allRecords) => {
    const { data: empData, error: empError } = await supabase
      .from('advances')
      .select('*')
      .order('employee_name', { ascending: true })

    const { data: detData, error: detError } = await supabase
      .from('advance_transactions')
      .select('*')
      .order('date', { ascending: false })

    const { data: custData } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (custData) setCustomers(custData)

    const { data: docData } = await supabase
      .from('documents')
      .select('*, customers(*)')
      .order('created_at', { ascending: false })
    if (docData) setDocuments(docData)

    await fetchItemOptions()

    if (!detError && detData) {
      setAdvanceDetails(detData)
    }

    if (!empError && empData) {
      const calculatedEmployees = empData.map(emp => {
        const empAdvances = (detData || []).filter(d => d.employee_id === emp.id)
        const totalInitial = empAdvances.reduce((sum, d) => sum + Number(d.amount), 0)

        const empNameTrimmed = emp.employee_name.trim().toLowerCase()
        const empDeductions = currentRecords.filter(r => {
          if (r.advance_deduction_employee) {
            return r.advance_deduction_employee.trim().toLowerCase() === empNameTrimmed
          }
          return false
        })
        const totalDeducted = empDeductions.reduce((sum, r) => sum + Number(r.advance_deduction_amount || 0), 0)

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

  const handleAddItemOption = async (e) => {
    e.preventDefault()
    if (!newItemOptionName.trim()) return

    const { error } = await supabase.from('item_options').insert([{ name: newItemOptionName.trim() }])
    if (error) {
      alert('新增項目失敗: ' + error.message)
    } else {
      setNewItemOptionName('')
      fetchItemOptions()
    }
  }

  const handleUpdateItemOption = async (id) => {
    if (!editingItemOptionName.trim()) return

    const { error } = await supabase.from('item_options').update({ name: editingItemOptionName.trim() }).eq('id', id)
    if (error) {
      alert('更新項目失敗: ' + error.message)
    } else {
      setEditingItemOptionId(null)
      setEditingItemOptionName('')
      fetchItemOptions()
    }
  }

  const handleDeleteItemOption = async (id) => {
    if (!window.confirm('確定要刪除這個常用項目嗎？')) return

    const { error } = await supabase.from('item_options').delete().eq('id', id)
    if (error) {
      alert('刪除失敗: ' + error.message)
    } else {
      fetchItemOptions()
    }
  }

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    if (!newEmpName.trim()) {
      alert('請輸入員工姓名！')
      return
    }

    const { error } = await supabase
      .from('advances')
      .insert([{ 
        employee_name: newEmpName.trim(), 
        role: newEmpRole.trim() || null,
        initial_amount: 0, 
        balance: 0, 
        status: 'active' 
      }])

    if (error) {
      alert('新增員工失敗（可能已存在）：' + error.message)
    } else {
      alert(`✅ 成功新增員工：${newEmpName}${newEmpRole ? ` (${newEmpRole})` : ''}`)
      setNewEmpName('')
      setNewEmpRole('')
      await fetchData()
    }
  }

  const handleStartEditEmployee = (emp) => {
    setEditingEmpId(emp.id)
    setEditingEmpForm({
      employee_name: emp.employee_name || '',
      role: emp.role || ''
    })
  }

  const handleSaveEditEmployee = async (id) => {
    if (!editingEmpForm.employee_name.trim()) {
      alert('員工姓名不能為空！')
      return
    }

    const { error } = await supabase
      .from('advances')
      .update({
        employee_name: editingEmpForm.employee_name.trim(),
        role: editingEmpForm.role.trim() || null
      })
      .eq('id', id)

    if (error) {
      alert('更新員工檔案失敗：' + error.message)
    } else {
      alert('✅ 員工檔案更新成功！')
      setEditingEmpId(null)
      await fetchData()
    }
  }

  const handleMarkResigned = async (emp) => {
    if (!window.confirm(`確定要將員工「${emp.employee_name}」設為離職狀態嗎？`)) return
    const { error } = await supabase.from('advances').update({ status: 'resigned' }).eq('id', emp.id)
    if (error) alert('更新狀態失敗：' + error.message)
    else fetchData()
  }

  const handleDeleteEmployee = async (emp) => {
    if (!window.confirm(`⚠️ 確定要永久刪除員工「${emp.employee_name}」及其所有預支記錄嗎？此動作無法復原！`)) return
    const { error } = await supabase.from('advances').delete().eq('id', emp.id)
    if (error) alert('刪除員工失敗：' + error.message)
    else fetchData()
  }

  const handleRestoreEmployee = async (emp) => {
    const { error } = await supabase.from('advances').update({ status: 'active' }).eq('id', emp.id)
    if (error) alert('狀態更新失敗：' + error.message)
    else fetchData()
  }

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

  const handleStartEditAdvanceTx = (det) => {
    setEditingAdvanceTxId(det.id)
    setEditingAdvanceTxForm({
      employee_id: det.employee_id || '',
      date: det.date ? det.date.toString().split('T')[0] : '',
      amount: det.amount || '',
      method: det.method || '銀行轉賬',
      remark: det.remark || ''
    })
  }

  const handleSaveEditAdvanceTx = async (id) => {
    if (!editingAdvanceTxForm.employee_id || !editingAdvanceTxForm.amount) {
      alert('員工與預支金額不能為空！')
      return
    }

    const amt = parseFloat(editingAdvanceTxForm.amount)
    if (isNaN(amt) || amt <= 0) {
      alert('請輸入有效的預支金額！')
      return
    }

    const { error } = await supabase
      .from('advance_transactions')
      .update({
        employee_id: editingAdvanceTxForm.employee_id,
        date: editingAdvanceTxForm.date,
        amount: amt,
        method: editingAdvanceTxForm.method,
        remark: editingAdvanceTxForm.remark
      })
      .eq('id', id)

    if (error) {
      alert('更新預支記錄失敗：' + error.message)
    } else {
      alert('✅ 預支記錄更新成功！')
      setEditingAdvanceTxId(null)
      const records = await fetchRecords()
      await fetchData(records)
    }
  }

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
      
      setSalaryEmployee('')
      setSalaryAmount('')
      setSalaryMethod('')
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

  const handleBatchUpdateSubmit = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`確定要將選取的 ${selectedIds.length} 筆記錄進行批次修改嗎？`)) return

    setIsLoading(true)
    try {
      for (const id of selectedIds) {
        const target = allRecords.find(r => r.id === id)
        if (!target) continue

        const updatePayload = {
          is_reimbursed: batchForm.is_reimbursed,
          remark: batchForm.remark !== '' ? batchForm.remark : target.remark
        }

        if (batchForm.reimbursement_method) {
          updatePayload.reimbursement_method = batchForm.reimbursement_method
          updatePayload.reimburser = batchForm.reimburser || target.reimburser
          updatePayload.advance_deduction_employee = batchForm.reimburser || target.reimburser || target.advance_deduction_employee
          updatePayload.advance_deduction_amount = batchForm.is_reimbursed ? Number(target.amount || 0) : 0
        } else if (batchForm.reimburser) {
          updatePayload.reimburser = batchForm.reimburser
          updatePayload.advance_deduction_employee = batchForm.reimburser
          updatePayload.advance_deduction_amount = batchForm.is_reimbursed ? Number(target.amount || 0) : 0
        } else if (!batchForm.is_reimbursed) {
          updatePayload.advance_deduction_amount = 0
        }

        await supabase.from('transactions').update(updatePayload).eq('id', id)
      }

      alert('✅ 批次修改完成！')
      setIsBatchEditing(false)
      setSelectedIds([])
      const records = await fetchRecords()
      await fetchData(records)
    } catch (err) {
      alert('❌ 批次修改失敗：' + err.message)
    } finally {
      setIsLoading(false)
    }
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
      reimburser: record.reimburser || record.advance_deduction_employee || '',
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
      const updateData = {
        amount: newAmount,
        category: inlineForm.category,
        item_name: inlineForm.item_name,
        type: inlineForm.type,
        is_reimbursed: inlineForm.is_reimbursed,
        account_method: inlineForm.type === 'income' && inlineForm.is_reimbursed ? inlineForm.account_method : null,
        reimburser: inlineForm.type === 'expense' && inlineForm.is_reimbursed ? inlineForm.reimburser : null,
        reimbursement_method: inlineForm.type === 'expense' && inlineForm.is_reimbursed ? inlineForm.reimbursement_method : null,
        remark: inlineForm.remark,
        transaction_date: inlineForm.transaction_date
      }

      if (inlineForm.type === 'expense') {
        updateData.advance_deduction_employee = inlineForm.is_reimbursed ? inlineForm.reimburser : null
        updateData.advance_deduction_amount = inlineForm.is_reimbursed ? newAmount : 0
      }

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
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
      const records = await fetchRecords()
      await fetchData(records)
    } catch (error) {
      alert('❌ 上傳收據失敗：' + error.message)
    } finally {
      setIsLoading(false)
      if (historyFileInputRef.current) {
        historyFileInputRef.current.value = ''
      }
    }
  }

  const handleSaveCustomer = async (e) => {
    e.preventDefault()
    if (!newCustName.trim()) {
      alert('請輸入客戶名稱！')
      return
    }

    if (editingCustId) {
      const { error } = await supabase.from('customers').update({
        name: newCustName,
        contact_person: newCustContact,
        email: newCustEmail,
        phone: newCustPhone,
        address: newCustAddress,
        status: newCustStatus
      }).eq('id', editingCustId)

      if (error) {
        alert('更新客戶失敗: ' + error.message)
      } else {
        alert('✅ 客戶更新成功！')
        setEditingCustId(null)
        setNewCustName('')
        setNewCustContact('')
        setNewCustEmail('')
        setNewCustPhone('')
        setNewCustAddress('')
        setNewCustStatus('active')
        fetchData()
      }
    } else {
      const { error } = await supabase.from('customers').insert([
        { 
          name: newCustName, 
          contact_person: newCustContact, 
          email: newCustEmail, 
          phone: newCustPhone, 
          address: newCustAddress,
          status: newCustStatus
        }
      ])
      if (error) {
        alert('新增客戶失敗: ' + error.message)
      } else {
        alert('✅ 客戶新增成功！')
        setNewCustName('')
        setNewCustContact('')
        setNewCustEmail('')
        setNewCustPhone('')
        setNewCustAddress('')
        setNewCustStatus('active')
        fetchData()
      }
    }
  }

  const handleStartEditCustomer = (cust) => {
    setEditingCustId(cust.id)
    setNewCustName(cust.name || '')
    setNewCustContact(cust.contact_person || '')
    setNewCustEmail(cust.email || '')
    setNewCustPhone(cust.phone || '')
    setNewCustAddress(cust.address || '')
    setNewCustStatus(cust.status || 'active')
  }

  const handleDeleteCustomer = async (custId) => {
    if (!window.confirm('⚠️ 確定要刪除這位客戶嗎？')) return

    const { error } = await supabase.from('customers').delete().eq('id', custId)
    if (error) {
      alert('刪除客戶失敗: ' + error.message)
    } else {
      alert('✅ 客戶已刪除')
      fetchData()
    }
  }

  const addItemRow = () => setItems([...items, { item_name: '', quantity: 1, sessions: 1, unit_price: 0, isCustom: false }])
  
  const updateItem = (index, field, value) => {
    const newItems = [...items]
    if (field === 'item_name' && value === 'CUSTOM_INPUT') {
      newItems[index].isCustom = true
      newItems[index].item_name = ''
    } else {
      newItems[index][field] = value
    }
    setItems(newItems)
  }

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index))
  
  const rawSubtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const sess = Number(item.sessions) || 1
    const price = Number(item.unit_price) || 0
    return sum + (qty * sess * price)
  }, 0)

  const percentageNum = Number(paymentPercentage) || 100
  const finalTotalAmount = rawSubtotal * (percentageNum / 100)

  const handleSaveDocument = async (e) => {
    e.preventDefault()
    if (!selectedCustomerId) {
      alert('請選擇客戶！')
      return
    }

    if (editingDocId) {
      const { error: docError } = await supabase.from('documents').update({
        type: docType,
        customer_id: selectedCustomerId,
        issue_date: issueDate,
        due_date: docType === 'quotation' ? (dueDate || null) : null,
        issued_by: issuedBy,
        subtotal: rawSubtotal,
        total_amount: finalTotalAmount,
        payment_percentage: percentageNum,
        payment_method: paymentMethod,
        payment_remark: paymentRemark,
        remark: docRemark
      }).eq('id', editingDocId)

      if (docError) {
        alert('更新單據失敗: ' + docError.message)
        return
      }

      await supabase.from('document_items').delete().eq('document_id', editingDocId)

      const itemsToInsert = items.map(item => {
        const qty = Number(item.quantity) || 1
        const sess = Number(item.sessions) || 1
        const price = Number(item.unit_price) || 0
        return {
          document_id: editingDocId,
          item_name: item.item_name,
          quantity: qty,
          sessions: sess,
          unit_price: price,
          amount: qty * sess * price
        }
      })

      await supabase.from('document_items').insert(itemsToInsert)

      alert('✅ 單據更新成功！')
      setEditingDocId(null)
      setView('documents')
      fetchData()
    } else {
      const finalDocNumber = await generateDocNumber(docType, issueDate, documents)

      const { data: docResult, error: docError } = await supabase.from('documents').insert([
        {
          type: docType,
          doc_number: finalDocNumber,
          customer_id: selectedCustomerId,
          issue_date: issueDate,
          due_date: docType === 'quotation' ? (dueDate || null) : null,
          issued_by: issuedBy,
          subtotal: rawSubtotal,
          total_amount: finalTotalAmount,
          payment_percentage: percentageNum,
          payment_method: paymentMethod,
          payment_remark: paymentRemark,
          remark: docRemark,
          status: 'draft'
        }
      ]).select().single()

      if (docError) {
        alert('儲存失敗: ' + docError.message)
        return
      }

      const docId = docResult.id
      const itemsToInsert = items.map(item => {
        const qty = Number(item.quantity) || 1
        const sess = Number(item.sessions) || 1
        const price = Number(item.unit_price) || 0
        return {
          document_id: docId,
          item_name: item.item_name,
          quantity: qty,
          sessions: sess,
          unit_price: price,
          amount: qty * sess * price
        }
      })

      const { error: itemError } = await supabase.from('document_items').insert(itemsToInsert)
      if (itemError) {
        alert('儲存明細失敗: ' + itemError.message)
        return
      }

      alert('✅ 單據建立成功！')
      setView('documents')
      fetchData()
    }
  }

  const handleStartEditDocument = async (doc) => {
    setEditingDocId(doc.id)
    setDocType(doc.type)
    setDocNumber(doc.doc_number)
    setSelectedCustomerId(doc.customer_id)
    setIssueDate(doc.issue_date)
    setDueDate(doc.due_date || '')
    setIssuedBy(doc.issued_by || '')
    setDocRemark(doc.remark || '')
    setPaymentPercentage(doc.payment_percentage ?? 100)
    setPaymentMethod(doc.payment_method || '銀行轉賬')
    setPaymentRemark(doc.payment_remark || '')

    const { data: itemsData } = await supabase
      .from('document_items')
      .select('*')
      .eq('document_id', doc.id)

    if (itemsData && itemsData.length > 0) {
      setItems(itemsData.map(i => {
        const name = i.item_name || ''
        const existsInCommon = commonItemOptions.some(opt => opt.name === name)
        return { 
          item_name: name, 
          quantity: i.quantity || 1, 
          sessions: i.sessions || 1, 
          unit_price: i.unit_price,
          isCustom: !existsInCommon && name !== ''
        }
      }))
    } else {
      setItems([{ item_name: '', quantity: 1, sessions: 1, unit_price: 0, isCustom: false }])
    }

    setView('createDoc')
  }

  const handleUpdateDocStatus = async (docId, newStatus) => {
    const { error } = await supabase
      .from('documents')
      .update({ status: newStatus })
      .eq('id', docId)

    if (error) {
      alert('更新狀態失敗: ' + error.message)
    } else {
      fetchData()
    }
  }

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('⚠️ 確定要刪除這張單據嗎？此動作將同時刪除其項目細明且無法復原！')) return

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)

    if (error) {
      alert('刪除單據失敗: ' + error.message)
    } else {
      alert('✅ 單據已成功刪除')
      fetchData()
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchType = docFilterType === 'all' || doc.type === docFilterType
    const matchStatus = docFilterStatus === 'all' || doc.status === docFilterStatus
    const matchCustomer = docFilterCustomerId === 'all' || doc.customer_id === docFilterCustomerId

    const searchLower = docFilterSearch.toLowerCase()
    const matchSearch = !docFilterSearch || 
      (doc.doc_number && doc.doc_number.toLowerCase().includes(searchLower)) ||
      (doc.issued_by && doc.issued_by.toLowerCase().includes(searchLower)) ||
      (doc.remark && doc.remark.toLowerCase().includes(searchLower))

    let matchDate = true
    if (docFilterStartDate && doc.issue_date < docFilterStartDate) {
      matchDate = false
    }
    if (docFilterEndDate && doc.issue_date > docFilterEndDate) {
      matchDate = false
    }

    return matchType && matchStatus && matchCustomer && matchSearch && matchDate
  })

  const filteredDocsTotalAmount = filteredDocuments.reduce((sum, d) => sum + Number(d.total_amount || 0), 0)

  const filteredRecords = allRecords.filter(record => {
    const matchCategory = selectedCategories.length === 0 || (record.category && selectedCategories.includes(record.category))
    const matchType = selectedTypeFilter === 'all' || record.type === selectedTypeFilter
    
    let matchStatus = true
    if (selectedStatusFilter === 'completed') {
      matchStatus = !!record.is_reimbursed
    } else if (selectedStatusFilter === 'pending') {
      matchStatus = !record.is_reimbursed
    }

    const matchSearch = !searchText || (record.item_name && record.item_name.toLowerCase().includes(searchText.toLowerCase())) || (record.remark && record.remark.toLowerCase().includes(searchText.toLowerCase()))

    let matchDate = true
    if (startDate && record.transaction_date < startDate) {
      matchDate = false
    }
    if (endDate && record.transaction_date > endDate) {
      matchDate = false
    }

    return matchCategory && matchType && matchStatus && matchSearch && matchDate
  })

  const filteredTotalIncome = filteredRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const filteredTotalExpense = filteredRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const filteredNetBalance = filteredTotalIncome - filteredTotalExpense

  const selectedRecordsList = allRecords.filter(r => selectedIds.includes(r.id))
  const selectedTotalIncome = selectedRecordsList
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + Number(r.amount), 0)
  const selectedTotalExpense = selectedRecordsList
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount), 0)
  const selectedNetBalance = selectedTotalIncome - selectedTotalExpense

  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage) || 1

  const accountMethodOptions = ['轉賬匯款', '銀行轉賬', '支票', '現金']
  const activeEmployees = employees.filter(e => e.status === 'active')

  if (view === 'printPreview' && selectedPrintDoc) {
    const cust = selectedPrintDoc.customerData || {}
    const docData = selectedPrintDoc.documentData || {}
    const pct = docData.payment_percentage ?? 100
    const method = docData.payment_method || '銀行轉賬'
    const pRemark = docData.payment_remark || ''

    return (
      <div className="min-h-screen bg-white p-8 font-sans max-w-3xl mx-auto">
        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        
        <div className="flex justify-between items-center mb-6 no-print">
          <button onClick={() => setView('documents')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
            ← 返回單據列表
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow">
            🖨️ 直接列印 / 存為 PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg text-gray-800 font-sans relative">
          <div className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">
                {docData.type === 'quotation' ? '報價單 QUOTATION' : '發票 INVOICE'}
              </h2>
              <p className="text-xs text-gray-600 mt-1">單號：<span className="font-bold text-gray-800">{docData.doc_number}</span></p>
            </div>
            <div className="text-right text-xs text-gray-700 space-y-1">
              <p>開立日期：{docData.issue_date}</p>
              {docData.type === 'quotation' && docData.due_date && (
                <p>到期日：{docData.due_date}</p>
              )}
              {docData.issued_by && (
                <p className="font-semibold text-gray-900">發出人：{docData.issued_by}</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded mb-4 text-xs space-y-1">
            <p className="font-bold text-gray-700 mb-1">客戶資訊：</p>
            <p className="text-gray-900 font-semibold text-sm">{cust.name || cust.company_name || '未知客戶'}</p>
            <p className="text-gray-600">聯絡人：{cust.contact_person || cust.contact || '-'} | 電話：{cust.phone || '-'}</p>
            {cust.email && <p className="text-gray-600">Email：{cust.email}</p>}
            {cust.address && <p className="text-gray-600">Address：{cust.address}</p>}
          </div>

          <table className="w-full text-xs border-collapse mb-4">
            <thead>
              <tr className="bg-gray-800 text-white text-left">
                <th className="p-2.5">項目說明</th>
                <th className="p-2.5 text-center">數量</th>
                <th className="p-2.5 text-center">節數</th>
                <th className="p-2.5 text-right">單價</th>
                <th className="p-2.5 text-right">小計</th>
              </tr>
            </thead>
            <tbody>
              {selectedPrintDoc.items.map((item, idx) => {
                const qty = Number(item.quantity) || 1
                const sess = Number(item.sessions) || 1
                const price = Number(item.unit_price) || 0
                const rowTotal = qty * sess * price
                return (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5">{item.item_name}</td>
                    <td className="p-2.5 text-center">{qty}</td>
                    <td className="p-2.5 text-center">{sess}</td>
                    <td className="p-2.5 text-right">${price.toFixed(2)}</td>
                    <td className="p-2.5 text-right font-bold">${rowTotal.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex justify-end mb-4">
            <div className="bg-gray-100 p-3 rounded text-right w-64 space-y-1">
              <p className="text-[11px] text-gray-600">項目總額：${Number(docData.subtotal || docData.total_amount).toFixed(2)}</p>
              <p className="text-[11px] text-gray-600">支付比例：{pct}%</p>
              <p className="text-[10px] text-gray-500 pt-1 border-t">應付總金額 (Total Amount)</p>
              <p className="text-xl font-bold text-emerald-600">${Number(docData.total_amount).toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-3 rounded mb-4 text-xs space-y-1">
            <p className="font-bold text-gray-700">支付方式：<span className="text-blue-600">{method}</span></p>
            {pRemark && <p className="text-gray-600">支付備註：{pRemark}</p>}
          </div>

          {docData.remark && (
            <div className="border-t pt-3 text-xs text-gray-600 mb-8">
              <p className="font-bold mb-1">備註：</p>
              <p>{docData.remark}</p>
            </div>
          )}

          {/* 公司印章區塊 */}
          <div className="flex justify-end mt-6">
            <div className="text-center relative">
              <p className="text-[11px] text-gray-600 mb-1 font-semibold">STCCML Production</p>
              <img 
                src="/Chop.png" 
                alt="公司印章" 
                style={{ width: '130px', opacity: 0.85, mixBlendMode: 'multiply' }} 
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

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
        
        {/* 頂部導覽列 */}
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

        {view === 'salary' ? (
          // ================= 支付薪金版面 =================
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">支付薪金管理</h1>
              <button onClick={() => setView('home')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
                ← 返回主畫面
              </button>
            </div>

            <form onSubmit={handlePaySalary} className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">選擇員工 <span className="text-red-500">*</span></label>
                <select value={salaryEmployee} onChange={(e) => setSalaryEmployee(e.target.value)} className="w-full border rounded p-2 text-sm bg-white outline-none">
                  <option value="">請選擇員工</option>
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.employee_name}>{emp.employee_name} {emp.role ? `(${emp.role})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">薪金金額 (HKD) <span className="text-red-500">*</span></label>
                <input type="number" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} className="w-full border rounded p-2 text-sm outline-none bg-white" placeholder="0.00" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">發放方式</label>
                <select value={salaryMethod} onChange={(e) => setSalaryMethod(e.target.value)} className="w-full border rounded p-2 text-sm bg-white outline-none text-gray-700">
                  <option value="">請選擇支付方式</option>
                  {accountMethodOptions.map(m => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">發放日期</label>
                <input 
                  type="date" 
                  value={salaryDate} 
                  onChange={(e) => setSalaryDate(e.target.value)} 
                  className="w-full max-w-[220px] box-border min-w-0 block border rounded p-2 text-sm outline-none bg-white [color-scheme:light]" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">備註</label>
                <input type="text" value={salaryRemark} onChange={(e) => setSalaryRemark(e.target.value)} className="w-full border rounded p-2 text-sm outline-none bg-white" placeholder="例如：本月薪金發放（選填）" />
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-3 rounded-lg font-bold shadow">
                {isLoading ? '處理中...' : '確認支付並記錄薪金'}
              </button>
            </form>
          </>
        ) : view === 'advances' ? (
          // ================= 人事及資金管理面板 =================
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">人事及資金管理</h1>
              <button onClick={() => setView('home')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
                ← 返回主畫面
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="bg-gray-50 p-3 rounded-lg border mb-4 space-y-2">
              <h2 className="text-xs font-bold text-gray-800">新增員工檔案</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">員工姓名 *</label>
                  <input type="text" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} className="w-full border rounded p-1.5 text-xs outline-none bg-white" placeholder="姓名" required />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">崗位 / 職位</label>
                  <input type="text" value={newEmpRole} onChange={(e) => setNewEmpRole(e.target.value)} className="w-full border rounded p-1.5 text-xs outline-none bg-white" placeholder="如：攝影師、助理" />
                </div>
              </div>
              <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white text-xs py-1.5 rounded font-bold shadow">新增員工</button>
            </form>

            {/* 新增預支資金記錄表單（「日期」輸入框尺寸已嚴格限制為 max-w-[110px]） */}
            <form onSubmit={handleAddAdvanceTransaction} className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 mb-6 space-y-2.5">
              <h2 className="text-xs font-bold text-indigo-900">新增預支資金記錄</h2>
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">選擇員工</label>
                  <select value={selectedEmpIdForAdvance} onChange={(e) => setSelectedEmpIdForAdvance(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white outline-none">
                    <option value="">請選擇員工</option>
                    {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.employee_name} {emp.role ? `[${emp.role}]` : ''} ({emp.status === 'active' ? '正常' : '已離職/停用'})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">日期</label>
                  <input 
                    type="date" 
                    value={advanceDate} 
                    onChange={(e) => setAdvanceDate(e.target.value)} 
                    className="w-full max-w-[110px] box-border min-w-0 block border rounded p-1.5 text-xs outline-none bg-white [color-scheme:light]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">預支金額 (HKD)</label>
                  <input type="number" value={advanceAmt} onChange={(e) => setAdvanceAmt(e.target.value)} className="w-full border rounded p-1.5 text-xs outline-none bg-white" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">預支方式</label>
                  <select value={advanceMethod} onChange={(e) => setAdvanceMethod(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white outline-none text-gray-700">
                    {accountMethodOptions.map(m => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">備註</label>
                <input type="text" value={advanceRemark} onChange={(e) => setAdvanceRemark(e.target.value)} className="w-full border rounded p-1.5 text-xs outline-none bg-white" placeholder="備註說明（選填）" />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded font-bold shadow">記錄預支資金</button>
            </form>

            <div className="mb-4 border rounded-lg bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setIsEmployeesExpanded(!isEmployeesExpanded)}
                className="w-full flex justify-between items-center px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b font-bold text-gray-800 text-xs"
              >
                <span>👥 員工狀態與預支餘額 ({employees.length} 位)</span>
                <span className="text-gray-500 text-[11px] font-semibold">{isEmployeesExpanded ? '▲ 收起' : '▼ 展開'}</span>
              </button>

              {isEmployeesExpanded && (
                <div className="p-2.5 space-y-2">
                  {employees.length === 0 ? (
                    <p className="text-gray-500 text-center text-xs py-2">尚無員工檔案</p>
                  ) : (
                    employees.map(emp => {
                      const isEditingThisEmp = editingEmpId === emp.id

                      return (
                        <div key={emp.id} className="bg-gray-50 p-2.5 rounded border text-xs">
                          {isEditingThisEmp ? (
                            <div className="space-y-2 bg-white p-2 rounded border border-amber-300">
                              <p className="font-bold text-amber-800 text-[11px]">✏️ 編輯員工檔案</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">員工姓名</label>
                                  <input 
                                    type="text" 
                                    value={editingEmpForm.employee_name} 
                                    onChange={(e) => setEditingEmpForm({ ...editingEmpForm, employee_name: e.target.value })}
                                    className="w-full border rounded p-1 text-xs outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">崗位 / 職位</label>
                                  <input 
                                    type="text" 
                                    value={editingEmpForm.role} 
                                    onChange={(e) => setEditingEmpForm({ ...editingEmpForm, role: e.target.value })}
                                    placeholder="如：攝影師、助理"
                                    className="w-full border rounded p-1 text-xs outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-1 justify-end pt-1">
                                <button onClick={() => handleSaveEditEmployee(emp.id)} className="bg-green-600 text-white px-2.5 py-1 rounded font-bold">儲存</button>
                                <button onClick={() => setEditingEmpId(null)} className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-semibold">取消</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-800 text-sm">{emp.employee_name}</span>
                                  {emp.role && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                      {emp.role}
                                    </span>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {emp.status === 'active' ? '正常' : '已離職/停用'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-600">累計預支：${emp.initial_amount.toFixed(2)}</p>
                                <p className="text-[11px] text-gray-600">剩餘餘額：<strong className="text-indigo-600">${emp.balance.toFixed(2)}</strong></p>
                              </div>

                              <div className="flex gap-1 items-center pt-0.5">
                                <button onClick={() => handleStartEditEmployee(emp)} className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-1 rounded">編輯 ✏️</button>
                                {emp.status === 'active' ? (
                                  <>
                                    <button onClick={() => handleMarkResigned(emp)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold px-2 py-1 rounded">設為離職</button>
                                    <button onClick={() => handleDeleteEmployee(emp)} className="bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold px-2 py-1 rounded">刪除</button>
                                  </>
                                ) : (
                                  <button onClick={() => handleRestoreEmployee(emp)} className="bg-green-50 hover:bg-green-100 text-green-600 text-[11px] font-semibold px-2 py-1 rounded">恢復正常</button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            <div className="mb-4 border rounded-lg bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setIsAdvanceHistoryExpanded(!isAdvanceHistoryExpanded)}
                className="w-full flex justify-between items-center px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b font-bold text-gray-800 text-xs"
              >
                <span>📜 預支資金歷史明細記錄 ({advanceDetails.length} 筆)</span>
                <span className="text-gray-500 text-[11px] font-semibold">{isAdvanceHistoryExpanded ? '▲ 收起' : '▼ 展開'}</span>
              </button>

              {isAdvanceHistoryExpanded && (
                <div className="p-2.5 space-y-2">
                  {advanceDetails.length === 0 ? (
                    <p className="text-gray-500 text-center text-xs py-2">尚無預支明細</p>
                  ) : (
                    advanceDetails.map(det => {
                      const emp = employees.find(e => e.id === det.employee_id)
                      const isEditingThisTx = editingAdvanceTxId === det.id

                      return (
                        <div key={det.id} className="bg-gray-50 p-2.5 rounded border text-xs">
                          {isEditingThisTx ? (
                            <div className="space-y-2 bg-white p-2 rounded border border-indigo-300">
                              <p className="font-bold text-indigo-900 text-[11px]">✏️ 編輯預支明細記錄</p>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">員工</label>
                                  <select 
                                    value={editingAdvanceTxForm.employee_id} 
                                    onChange={(e) => setEditingAdvanceTxForm({ ...editingAdvanceTxForm, employee_id: e.target.value })}
                                    className="w-full border rounded p-1 text-xs bg-white outline-none"
                                  >
                                    {employees.map(e => (
                                      <option key={e.id} value={e.id}>{e.employee_name} {e.role ? `[${e.role}]` : ''}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">日期</label>
                                  <input 
                                    type="date" 
                                    value={editingAdvanceTxForm.date} 
                                    onChange={(e) => setEditingAdvanceTxForm({ ...editingAdvanceTxForm, date: e.target.value })}
                                    className="w-full max-w-[110px] box-border min-w-0 block border rounded p-1 text-xs outline-none bg-white [color-scheme:light]"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">預支金額 (HKD)</label>
                                  <input 
                                    type="number" 
                                    value={editingAdvanceTxForm.amount} 
                                    onChange={(e) => setEditingAdvanceTxForm({ ...editingAdvanceTxForm, amount: e.target.value })}
                                    className="w-full border rounded p-1 text-xs outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-0.5">方式</label>
                                  <select 
                                    value={editingAdvanceTxForm.method} 
                                    onChange={(e) => setEditingAdvanceTxForm({ ...editingAdvanceTxForm, method: e.target.value })}
                                    className="w-full border rounded p-1 text-xs bg-white outline-none"
                                  >
                                    {accountMethodOptions.map(m => (<option key={m} value={m}>{m}</option>))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] text-gray-500 mb-0.5">備註</label>
                                <input 
                                  type="text" 
                                  value={editingAdvanceTxForm.remark} 
                                  onChange={(e) => setEditingAdvanceTxForm({ ...editingAdvanceTxForm, remark: e.target.value })}
                                  className="w-full border rounded p-1 text-xs outline-none"
                                  placeholder="備註說明（選填）"
                                />
                              </div>

                              <div className="flex gap-1 justify-end pt-1">
                                <button onClick={() => handleSaveEditAdvanceTx(det.id)} className="bg-indigo-600 text-white px-2.5 py-1 rounded font-bold">儲存</button>
                                <button onClick={() => setEditingAdvanceTxId(null)} className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-semibold">取消</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {emp ? emp.employee_name : '未知員工'} {emp?.role ? `(${emp.role})` : ''} - <span className="text-indigo-600 font-bold">${det.amount.toFixed(2)}</span> ({det.method})
                                </p>
                                <p className="text-[10px] text-gray-500">{det.date} {det.remark ? `| 備註：${det.remark}` : ''}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => handleStartEditAdvanceTx(det)} className="text-amber-700 hover:text-amber-800 text-[11px] font-semibold bg-amber-50 px-2 py-1 rounded">編輯 ✏️</button>
                                <button onClick={() => handleDeleteAdvanceTransaction(det)} className="text-red-500 hover:text-red-700 text-[11px] font-semibold bg-red-50 px-2 py-1 rounded">刪除 🗑️</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </>
        ) : view === 'itemOptions' ? (
          // ================= 項目說明管理面板 =================
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">項目說明管理</h1>
              <button onClick={() => setView('home')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
                ← 返回主畫面
              </button>
            </div>

            <form onSubmit={handleAddItemOption} className="bg-gray-50 p-3 rounded-lg border mb-4 space-y-2">
              <h2 className="text-xs font-bold text-gray-800">新增常用項目說明</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newItemOptionName} 
                  onChange={(e) => setNewItemOptionName(e.target.value)} 
                  required 
                  className="flex-1 border rounded p-1.5 text-xs bg-white outline-none" 
                  placeholder="例如：Event Photography (活動拍攝)"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-bold">
                  新增項目
                </button>
              </div>
            </form>

            <h2 className="text-sm font-bold text-gray-800 mb-2">現有項目列表</h2>
            <div className="space-y-2">
              {commonItemOptions.length === 0 ? (
                <p className="text-gray-500 text-center text-xs py-2">尚無常用項目</p>
              ) : (
                commonItemOptions.map(opt => (
                  <div key={opt.id} className="bg-gray-50 p-2.5 rounded border flex justify-between items-center text-xs">
                    {editingItemOptionId === opt.id ? (
                      <div className="flex gap-2 flex-1 pr-2">
                        <input 
                          type="text" 
                          value={editingItemOptionName} 
                          onChange={(e) => setEditingItemOptionName(e.target.value)} 
                          className="flex-1 border rounded p-1 text-xs bg-white outline-none"
                        />
                        <button onClick={() => handleUpdateItemOption(opt.id)} className="bg-green-600 text-white px-2 py-1 rounded font-bold">儲存</button>
                        <button onClick={() => setEditingItemOptionId(null)} className="bg-gray-300 text-gray-700 px-2 py-1 rounded">取消</button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-gray-800">{opt.name}</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => { setEditingItemOptionId(opt.id); setEditingItemOptionName(opt.name); }} 
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-semibold"
                          >
                            編輯
                          </button>
                          <button 
                            onClick={() => handleDeleteItemOption(opt.id)} 
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded font-semibold"
                          >
                            刪除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : view === 'documents' ? (
          // ================= 報價單與發票記錄 =================
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">報價單與發票記錄</h1>
              <button onClick={() => setView('home')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
                ← 返回主畫面
              </button>
            </div>

            {/* 單據 Filter 控制列 */}
            <div className="mb-4 space-y-2.5 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-medium text-gray-700">單據類型：</label>
                <select
                  value={docFilterType}
                  onChange={(e) => setDocFilterType(e.target.value)}
                  className="border rounded p-1.5 bg-white outline-none w-48 text-gray-700"
                >
                  <option value="all">全部類型</option>
                  <option value="quotation">報價單 (Quotation)</option>
                  <option value="invoice">發票 (Invoice)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <label className="font-medium text-gray-700">單據狀態：</label>
                <select
                  value={docFilterStatus}
                  onChange={(e) => setDocFilterStatus(e.target.value)}
                  className="border rounded p-1.5 bg-white outline-none w-48 text-gray-700"
                >
                  <option value="all">全部狀態</option>
                  <option value="draft">草稿 (Draft)</option>
                  <option value="sent">已發送 (Sent)</option>
                  <option value="paid">已付款 (Paid)</option>
                  <option value="accepted">已接受 (Accepted)</option>
                  <option value="cancelled">已取消 (Cancelled)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <label className="font-medium text-gray-700">指定客戶：</label>
                <select
                  value={docFilterCustomerId}
                  onChange={(e) => setDocFilterCustomerId(e.target.value)}
                  className="border rounded p-1.5 bg-white outline-none w-48 text-gray-700"
                >
                  <option value="all">全部客戶</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <label className="font-medium text-gray-700">關鍵字搜尋：</label>
                <input
                  type="text"
                  value={docFilterSearch}
                  onChange={(e) => setDocFilterSearch(e.target.value)}
                  placeholder="單號 / 發出人 / 備註..."
                  className="border rounded p-1.5 bg-white outline-none w-48 text-gray-700"
                />
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <label className="font-medium text-gray-700">開立日期自：</label>
                <input
                  type="date"
                  value={docFilterStartDate}
                  onChange={(e) => setDocFilterStartDate(e.target.value)}
                  className="border rounded p-1.5 bg-white outline-none w-48 max-w-[55%] text-gray-700 [color-scheme:light]"
                />
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <label className="font-medium text-gray-700">開立日期至：</label>
                <input
                  type="date"
                  value={docFilterEndDate}
                  onChange={(e) => setDocFilterEndDate(e.target.value)}
                  className="border rounded p-1.5 bg-white outline-none w-48 max-w-[55%] text-gray-700 [color-scheme:light]"
                />
              </div>

              {(docFilterType !== 'all' || docFilterStatus !== 'all' || docFilterCustomerId !== 'all' || docFilterSearch || docFilterStartDate || docFilterEndDate) && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setDocFilterType('all')
                      setDocFilterStatus('all')
                      setDocFilterCustomerId('all')
                      setDocFilterSearch('')
                      setDocFilterStartDate('')
                      setDocFilterEndDate('')
                    }}
                    className="text-blue-600 underline text-[11px] font-semibold"
                  >
                    重置所有篩選
                  </button>
                </div>
              )}
            </div>

            {/* 篩選結果加總資訊列 */}
            <div className="mb-4 bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-xs flex justify-between items-center">
              <span className="text-blue-900 font-bold">符合篩選：{filteredDocuments.length} 張單據</span>
              <span className="text-blue-900">總金額：<strong className="text-emerald-600 text-sm font-bold">${filteredDocsTotalAmount.toFixed(2)}</strong></span>
            </div>

            <div className="space-y-3">
              {filteredDocuments.length === 0 ? (
                <p className="text-gray-500 text-center text-sm py-6">找不到符合條件的單據記錄</p>
              ) : (
                filteredDocuments.map(doc => (
                  <div key={doc.id} className="bg-gray-50 p-3 rounded-lg border flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{doc.doc_number}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${doc.type === 'quotation' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {doc.type === 'quotation' ? '報價單' : '發票'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">客戶：{doc.customers?.name || doc.customers?.company_name || '未知客戶'} | 日期：{doc.issue_date}</p>
                        {doc.issued_by && <p className="text-[11px] text-gray-500">發出人：{doc.issued_by}</p>}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">${Number(doc.total_amount).toFixed(2)}</div>
                        <select 
                          value={doc.status} 
                          onChange={(e) => handleUpdateDocStatus(doc.id, e.target.value)}
                          className="mt-1 text-[11px] uppercase bg-white border rounded px-1.5 py-0.5 font-bold text-gray-700 outline-none cursor-pointer"
                        >
                          <option value="draft">草稿 (Draft)</option>
                          <option value="sent">已發送 (Sent)</option>
                          <option value="paid">已付款 (Paid)</option>
                          <option value="accepted">已接受 (Accepted)</option>
                          <option value="cancelled">已取消 (Cancelled)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                      <button 
                        onClick={() => handleStartEditDocument(doc)}
                        className="bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold px-3 py-1 rounded"
                      >
                        編輯 ✏️
                      </button>
                      <button 
                        onClick={async () => {
                          const { data: itemsData } = await supabase
                            .from('document_items')
                            .select('*')
                            .eq('document_id', doc.id)
                          
                          setSelectedPrintDoc({
                            documentData: doc,
                            customerData: doc.customers,
                            items: itemsData || []
                          })
                          setView('printPreview')
                        }}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold px-3 py-1 rounded"
                      >
                        列印 PDF 📄
                      </button>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold px-3 py-1 rounded"
                      >
                        刪除 🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : view === 'createDoc' ? (
          // ================= 建立 / 編輯單據表單 =================
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">{editingDocId ? '編輯單據' : '建立新單據'}</h1>
              <button onClick={() => setView('documents')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
                ← 返回單據列表
              </button>
            </div>
            <form onSubmit={handleSaveDocument} className="bg-gray-50 p-4 rounded-lg border space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">單據類型</label>
                  <select value={docType} onChange={async (e) => {
                    const t = e.target.value
                    setDocType(t)
                    if (!editingDocId) {
                      const newNum = await generateDocNumber(t, issueDate, documents)
                      setDocNumber(newNum)
                    }
                  }} className="w-full border rounded p-2 text-xs bg-white outline-none">
                    <option value="quotation">報價單</option>
                    <option value="invoice">發票</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">單號</label>
                  <input type="text" value={docNumber} readOnly className="w-full border rounded p-2 text-xs bg-gray-100 text-gray-600 outline-none font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">選擇客戶 <span className="text-red-500">*</span></label>
                <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required className="w-full border rounded p-2 text-xs bg-white outline-none">
                  <option value="">-- 請選擇客戶 --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">開立日期</label>
                <input 
                  type="date" 
                  value={issueDate} 
                  onChange={async (e) => {
                    const d = e.target.value
                    setIssueDate(d)
                    if (!editingDocId) {
                      const newNum = await generateDocNumber(docType, d, documents)
                      setDocNumber(newNum)
                    }
                  }} 
                  required 
                  className="w-full max-w-[220px] box-border min-w-0 block border rounded p-2 text-xs bg-white outline-none [color-scheme:light]" 
                />
              </div>

              {docType === 'quotation' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">到期日</label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)} 
                    className="w-full max-w-[220px] box-border min-w-0 block border rounded p-2 text-xs bg-white outline-none [color-scheme:light]" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">發出人 (Issued By)</label>
                <input type="text" value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} placeholder="例如：經理 / 財務部" className="w-full border rounded p-2 text-xs bg-white outline-none" />
              </div>

              <h3 className="text-xs font-bold text-gray-800 pt-2 border-t">項目細明</h3>
              {items.map((item, index) => (
                <div key={index} className="bg-white p-2.5 rounded border mb-2 space-y-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">項目說明</label>
                    {item.isCustom ? (
                      <div className="flex gap-1">
                        <input 
                          type="text" 
                          placeholder="請手動輸入項目說明" 
                          value={item.item_name} 
                          onChange={(e) => updateItem(index, 'item_name', e.target.value)} 
                          required 
                          className="flex-1 border rounded p-1.5 text-xs bg-white outline-none" 
                        />
                        <button 
                          type="button" 
                          onClick={() => updateItem(index, 'isCustom', false)} 
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 text-[10px] rounded font-semibold"
                        >
                          返回下拉
                        </button>
                      </div>
                    ) : (
                      <select 
                        value={item.item_name}
                        onChange={(e) => {
                          if (e.target.value === 'CUSTOM_INPUT') {
                            updateItem(index, 'item_name', 'CUSTOM_INPUT')
                          } else {
                            updateItem(index, 'item_name', e.target.value)
                          }
                        }}
                        required
                        className="w-full border rounded p-1.5 text-xs bg-white outline-none"
                      >
                        <option value="">-- 請選擇項目說明 --</option>
                        {commonItemOptions.map(opt => (
                          <option key={opt.id} value={opt.name}>{opt.name}</option>
                        ))}
                        <option value="CUSTOM_INPUT">✏️ 手動輸入其他項目...</option>
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">數量</label>
                      <input type="number" placeholder="數量" value={item.quantity} min="1" onChange={(e) => updateItem(index, 'quantity', e.target.value)} required className="w-full border rounded p-1.5 text-xs bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">節數</label>
                      <input type="number" placeholder="節數" value={item.sessions} min="1" onChange={(e) => updateItem(index, 'sessions', e.target.value)} required className="w-full border rounded p-1.5 text-xs bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">單價</label>
                      <input type="number" placeholder="單價" value={item.unit_price} min="0" onChange={(e) => updateItem(index, 'unit_price', e.target.value)} required className="w-full border rounded p-1.5 text-xs bg-white outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t text-xs">
                    <span className="text-gray-500">小計: <strong className="text-blue-600">${((Number(item.quantity) || 1) * (Number(item.sessions) || 1) * (Number(item.unit_price) || 0)).toFixed(2)}</strong></span>
                    {items.length > 1 && <button type="button" onClick={() => removeItem(index)} className="text-red-500 font-bold px-2 py-0.5 bg-red-50 rounded">刪除此項</button>}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addItemRow} className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded font-semibold">+ 新增項目細明</button>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">支付比例 (%)</label>
                  <input 
                    type="number" 
                    value={paymentPercentage} 
                    min="1" 
                    max="100" 
                    onChange={(e) => setPaymentPercentage(e.target.value)} 
                    className="w-full border rounded p-2 text-xs bg-white outline-none font-bold text-blue-600"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">折算後總金額</label>
                  <div className="p-2 text-sm font-bold text-emerald-600 bg-white border rounded">
                    ${finalTotalAmount.toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">(原價: ${rawSubtotal.toFixed(2)})</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">支付方式 (Payment Method)</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)} 
                  className="w-full border rounded p-2 text-xs bg-white outline-none"
                >
                  <option value="銀行轉賬">銀行轉賬 (Bank Transfer)</option>
                  <option value="支票">支票 (Cheque)</option>
                  <option value="現金">現金 (Cash)</option>
                </select>
              </div>

              {(paymentMethod === '支票' || paymentMethod === '銀行轉賬') && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {paymentMethod === '支票' ? '支票備註 (如：支票號碼/銀行)' : '銀行轉賬備註 (如：轉賬帳號/戶名)'}
                  </label>
                  <input 
                    type="text" 
                    value={paymentRemark} 
                    onChange={(e) => setPaymentRemark(e.target.value)} 
                    placeholder={paymentMethod === '支票' ? '請輸入支票號碼或相關資訊' : '請輸入轉賬帳號或相關資訊'} 
                    className="w-full border rounded p-2 text-xs bg-white outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">備註</label>
                <textarea value={docRemark} onChange={(e) => setDocRemark(e.target.value)} rows={2} className="w-full border rounded p-2 text-xs outline-none bg-white" placeholder="付款條件等..."></textarea>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-3 rounded-lg font-bold shadow">
                {editingDocId ? '儲存修改' : '儲存並建立單據'}
              </button>
            </form>
          </>
        ) : view === 'customers' ? (
          // ================= 客戶管理面板 =================
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">客戶管理</h1>
              <button onClick={() => setView('home')} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200">
                ← 返回主畫面
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="bg-gray-50 p-3 rounded-lg border mb-4 space-y-2">
              <h2 className="text-xs font-bold text-gray-800">{editingCustId ? '編輯客戶檔案' : '新增客戶檔案'}</h2>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">公司/客戶名稱 *</label>
                <input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} required className="w-full border rounded p-1.5 text-xs bg-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">聯絡人</label>
                  <input type="text" value={newCustContact} onChange={(e) => setNewCustContact(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">電話</label>
                  <input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">Email</label>
                <input type="email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white outline-none" placeholder="example@domain.com" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">Address</label>
                <input type="text" value={newCustAddress} onChange={(e) => setNewCustAddress(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white outline-none" placeholder="公司地址" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">狀態</label>
                <select value={newCustStatus} onChange={(e) => setNewCustStatus(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white outline-none">
                  <option value="active">有效 (Active)</option>
                  <option value="inactive">無效 (Inactive)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded font-bold shadow">
                  {editingCustId ? '儲存修改' : '儲存客戶'}
                </button>
                {editingCustId && (
                  <button type="button" onClick={() => {
                    setEditingCustId(null)
                    setNewCustName('')
                    setNewCustContact('')
                    setNewCustEmail('')
                    setNewCustPhone('')
                    setNewCustAddress('')
                    setNewCustStatus('active')
                  }} className="bg-gray-300 text-gray-700 text-xs px-3 py-2 rounded font-bold">
                    取消
                  </button>
                )}
              </div>
            </form>

            <h2 className="text-sm font-bold text-gray-800 mb-2">客戶列表</h2>
            <div className="space-y-2">
              {customers.length === 0 ? (
                <p className="text-gray-500 text-center text-xs py-2">尚無客戶記錄</p>
              ) : (
                customers.map(c => (
                  <div key={c.id} className="bg-gray-50 p-2.5 rounded border text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-sm">{c.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${c.status === 'inactive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {c.status === 'inactive' ? '無效' : '有效'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px]">聯絡人：{c.contact_person || '-'} | 電話：{c.phone || '-'}</p>
                    <p className="text-gray-500 text-[11px]">Email：{c.email || '-'}</p>
                    <p className="text-gray-500 text-[11px]">Address：{c.address || '-'}</p>
                    <div className="flex justify-end gap-1 pt-1 border-t">
                      <button onClick={() => handleStartEditCustomer(c)} className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-semibold">編輯 ✏️</button>
                      <button onClick={() => handleDeleteCustomer(c.id)} className="bg-red-50 text-red-600 px-2 py-1 rounded font-semibold">刪除 🗑️</button>
                    </div>
                  </div>
                ))
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
                              {emp.employee_name} {emp.role ? `[${emp.role}]` : ''} {emp.status === 'active' ? `(預支餘額: $${emp.balance.toFixed(2)})` : '(已離職/停用)'}
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
        ) : (
          // ================= 全部歷史記錄頁面 =================
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
        )}

      </div>
    </div>
  )
}

export default App