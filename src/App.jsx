import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { incomeCategories, expenseCategories, accountMethodOptions } from './constants'

import Navbar from './components/Navbar'
import HomeModule from './modules/HomeModule/HomeModule'
import AllRecordsModule from './modules/AllRecordsModule/AllRecordsModule'
import DocumentsModule from './modules/DocumentsModule/DocumentsModule'
import CreateDocModule from './modules/CreateDocModule/CreateDocModule'
import PrintPreviewModule from './modules/PrintPreviewModule/PrintPreviewModule'
import CustomersModule from './modules/CustomersModule/CustomersModule'
import AdvancesModule from './modules/AdvancesModule/AdvancesModule'
import SalaryModule from './modules/SalaryModule/SalaryModule'
import ItemOptionsModule from './modules/ItemOptionsModule/ItemOptionsModule'

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

// incomeCategories, expenseCategories imported from constants.js

  const getDynamicCategoryFilterOptions = () => {
    if (selectedTypeFilter === 'income') return incomeCategories
    if (selectedTypeFilter === 'expense') return expenseCategories
    return Array.from(new Set([...incomeCategories, ...expenseCategories]))
  }

  const currentCategoryFilterOptions = getDynamicCategoryFilterOptions()

  const generateDocNumber = async (typeVal, dateVal, existingDocs = documents, currentEditingId = editingDocId) => {
    const prefix = typeVal === 'quotation' ? 'QT' : 'INV'
    const dateStr = dateVal.replace(/-/g, '') 
    const pattern = `${prefix}-${dateStr}-`

    const otherDocs = existingDocs.filter(d => d.id !== currentEditingId)
    const sameDayDocs = otherDocs.filter(d => d.doc_number && d.doc_number.startsWith(pattern))
    const nextSeq = sameDayDocs.length + 1
    const seqStr = String(nextSeq).padStart(3, '0')

    return `${prefix}-${dateStr}-${seqStr}`
  }

  useEffect(() => {
    const updateNum = async () => {
      const num = await generateDocNumber(docType, issueDate, documents, editingDocId)
      setDocNumber(num)
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

        // 允許顯示負數餘額
        const finalBalance = totalInitial - totalDeducted

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

  // 修正：批次修改能正確將資料寫入 advance_deduction_amount 與 advance_deduction_employee
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

        if (target.type === 'expense') {
          const selectedEmp = batchForm.reimburser || target.reimburser || target.advance_deduction_employee
          updatePayload.reimburser = selectedEmp
          updatePayload.advance_deduction_employee = batchForm.is_reimbursed ? selectedEmp : null
          updatePayload.advance_deduction_amount = batchForm.is_reimbursed ? Number(target.amount || 0) : 0
          if (batchForm.reimbursement_method) {
            updatePayload.reimbursement_method = batchForm.reimbursement_method
          }
        } else if (target.type === 'income') {
          if (batchForm.reimbursement_method) {
            updatePayload.account_method = batchForm.reimbursement_method
          }
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

    setIsLoading(true)
    try {
      if (editingDocId) {
        const finalDocNumber = await generateDocNumber(docType, issueDate, documents, editingDocId)

        const { error: docError } = await supabase.from('documents').update({
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
          remark: docRemark
        }).eq('id', editingDocId)

        if (docError) throw docError

        const { error: delError } = await supabase.from('document_items').delete().eq('document_id', editingDocId)
        if (delError) throw delError

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

        const { error: insErr } = await supabase.from('document_items').insert(itemsToInsert)
        if (insErr) throw insErr

        alert('✅ 單據更新成功（單號已自動更新）！')
        setEditingDocId(null)
        setView('documents')
        await fetchData()
      } else {
        const finalDocNumber = await generateDocNumber(docType, issueDate, documents, null)

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

        if (docError) throw docError

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
        if (itemError) throw itemError

        alert('✅ 單據建立成功！')
        setView('documents')
        await fetchData()
      }
    } catch (err) {
      alert('❌ 儲存單據失敗：' + err.message)
    } finally {
      setIsLoading(false)
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

// accountMethodOptions imported from constants.js
  const activeEmployees = employees.filter(e => e.status === 'active')



  if (view === 'printPreview' && selectedPrintDoc) {
    return (
      <PrintPreviewModule 
        selectedPrintDoc={selectedPrintDoc} 
        setSelectedPrintDoc={setSelectedPrintDoc} 
        setView={setView} 
      />
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
        <Navbar 
          view={view}
          setView={setView}
          balance={balance}
          isLoading={isLoading}
          handleRefreshData={handleRefreshData}
          setSelectedCategories={setSelectedCategories}
          setSelectedTypeFilter={setSelectedTypeFilter}
          setSelectedStatusFilter={setSelectedStatusFilter}
          setSearchText={setSearchText}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setCurrentPage={setCurrentPage}
          setSelectedIds={setSelectedIds}
          setIsBatchEditing={setIsBatchEditing}
          setInlineEditingId={setInlineEditingId}
          setEditingDocId={setEditingDocId}
          setDocType={setDocType}
          setSelectedCustomerId={setSelectedCustomerId}
          setIssuedBy={setIssuedBy}
          setDocRemark={setDocRemark}
          setPaymentPercentage={setPaymentPercentage}
          setPaymentMethod={setPaymentMethod}
          setPaymentRemark={setPaymentRemark}
          setItems={setItems}
          setEditingCustId={setEditingCustId}
          setNewCustName={setNewCustName}
          setNewCustContact={setNewCustContact}
          setNewCustEmail={setNewCustEmail}
          setNewCustPhone={setNewCustPhone}
          setNewCustAddress={setNewCustAddress}
          setNewCustStatus={setNewCustStatus}
        />

        {view === 'salary' ? (
          <SalaryModule 
            salaryEmployee={salaryEmployee}
            setSalaryEmployee={setSalaryEmployee}
            salaryAmount={salaryAmount}
            setSalaryAmount={setSalaryAmount}
            salaryMethod={salaryMethod}
            setSalaryMethod={setSalaryMethod}
            salaryDate={salaryDate}
            setSalaryDate={setSalaryDate}
            salaryRemark={salaryRemark}
            setSalaryRemark={setSalaryRemark}
            employees={employees}
            activeEmployees={activeEmployees}
            handlePaySalary={handlePaySalary}
            isLoading={isLoading}
            setView={setView}
          />
        ) : view === 'advances' ? (
          <AdvancesModule 
            employees={employees}
            activeEmployees={activeEmployees}
            advanceDetails={advanceDetails}
            isEmployeesExpanded={isEmployeesExpanded}
            setIsEmployeesExpanded={setIsEmployeesExpanded}
            isAdvanceHistoryExpanded={isAdvanceHistoryExpanded}
            setIsAdvanceHistoryExpanded={setIsAdvanceHistoryExpanded}
            newEmpName={newEmpName}
            setNewEmpName={setNewEmpName}
            newEmpRole={newEmpRole}
            setNewEmpRole={setNewEmpRole}
            handleAddEmployee={handleAddEmployee}
            editingEmpId={editingEmpId}
            editingEmpForm={editingEmpForm}
            setEditingEmpForm={setEditingEmpForm}
            handleStartEditEmployee={handleStartEditEmployee}
            handleSaveEditEmployee={handleSaveEditEmployee}
            setEditingEmpId={setEditingEmpId}
            handleMarkResigned={handleMarkResigned}
            handleDeleteEmployee={handleDeleteEmployee}
            handleRestoreEmployee={handleRestoreEmployee}
            selectedEmpIdForAdvance={selectedEmpIdForAdvance}
            setSelectedEmpIdForAdvance={setSelectedEmpIdForAdvance}
            advanceDate={advanceDate}
            setAdvanceDate={setAdvanceDate}
            advanceAmt={advanceAmt}
            setAdvanceAmt={setAdvanceAmt}
            advanceMethod={advanceMethod}
            setAdvanceMethod={setAdvanceMethod}
            advanceRemark={advanceRemark}
            setAdvanceRemark={setAdvanceRemark}
            handleAddAdvanceTransaction={handleAddAdvanceTransaction}
            editingAdvanceTxId={editingAdvanceTxId}
            editingAdvanceTxForm={editingAdvanceTxForm}
            setEditingAdvanceTxForm={setEditingAdvanceTxForm}
            handleStartEditAdvanceTx={handleStartEditAdvanceTx}
            handleSaveEditAdvanceTx={handleSaveEditAdvanceTx}
            setEditingAdvanceTxId={setEditingAdvanceTxId}
            handleDeleteAdvanceTransaction={handleDeleteAdvanceTransaction}
            setView={setView}
          />
        ) : view === 'itemOptions' ? (
          <ItemOptionsModule 
            commonItemOptions={commonItemOptions}
            newItemOptionName={newItemOptionName}
            setNewItemOptionName={setNewItemOptionName}
            handleAddItemOption={handleAddItemOption}
            editingItemOptionId={editingItemOptionId}
            editingItemOptionName={editingItemOptionName}
            setEditingItemOptionName={setEditingItemOptionName}
            setEditingItemOptionId={setEditingItemOptionId}
            handleUpdateItemOption={handleUpdateItemOption}
            handleDeleteItemOption={handleDeleteItemOption}
            setView={setView}
          />
        ) : view === 'documents' ? (
          <DocumentsModule 
            documents={documents}
            customers={customers}
            filteredDocuments={filteredDocuments}
            filteredDocsTotalAmount={filteredDocsTotalAmount}
            docFilterType={docFilterType}
            setDocFilterType={setDocFilterType}
            docFilterStatus={docFilterStatus}
            setDocFilterStatus={setDocFilterStatus}
            docFilterCustomerId={docFilterCustomerId}
            setDocFilterCustomerId={setDocFilterCustomerId}
            docFilterSearch={docFilterSearch}
            setDocFilterSearch={setDocFilterSearch}
            docFilterStartDate={docFilterStartDate}
            setDocFilterStartDate={setDocFilterStartDate}
            docFilterEndDate={docFilterEndDate}
            setDocFilterEndDate={setDocFilterEndDate}
            handleStartEditDocument={handleStartEditDocument}
            handleDeleteDocument={handleDeleteDocument}
            handleUpdateDocStatus={handleUpdateDocStatus}
            setSelectedPrintDoc={setSelectedPrintDoc}
            setView={setView}
          />
        ) : view === 'createDoc' ? (
          <CreateDocModule 
            editingDocId={editingDocId}
            setEditingDocId={setEditingDocId}
            docType={docType}
            setDocType={setDocType}
            docNumber={docNumber}
            setDocNumber={setDocNumber}
            documents={documents}
            generateDocNumber={generateDocNumber}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
            issueDate={issueDate}
            setIssueDate={setIssueDate}
            dueDate={dueDate}
            setDueDate={setDueDate}
            issuedBy={issuedBy}
            setIssuedBy={setIssuedBy}
            items={items}
            addItemRow={addItemRow}
            updateItem={updateItem}
            removeItem={removeItem}
            commonItemOptions={commonItemOptions}
            rawSubtotal={rawSubtotal}
            percentageNum={percentageNum}
            paymentPercentage={paymentPercentage}
            setPaymentPercentage={setPaymentPercentage}
            finalTotalAmount={finalTotalAmount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentRemark={paymentRemark}
            setPaymentRemark={setPaymentRemark}
            docRemark={docRemark}
            setDocRemark={setDocRemark}
            handleSaveDocument={handleSaveDocument}
            isLoading={isLoading}
            setView={setView}
          />
        ) : view === 'customers' ? (
          <CustomersModule 
            customers={customers}
            documents={documents}
            editingCustId={editingCustId}
            setEditingCustId={setEditingCustId}
            newCustName={newCustName}
            setNewCustName={setNewCustName}
            newCustContact={newCustContact}
            setNewCustContact={setNewCustContact}
            newCustEmail={newCustEmail}
            setNewCustEmail={setNewCustEmail}
            newCustPhone={newCustPhone}
            setNewCustPhone={setNewCustPhone}
            newCustAddress={newCustAddress}
            setNewCustAddress={setNewCustAddress}
            newCustStatus={newCustStatus}
            setNewCustStatus={setNewCustStatus}
            handleSaveCustomer={handleSaveCustomer}
            handleStartEditCustomer={handleStartEditCustomer}
            handleDeleteCustomer={handleDeleteCustomer}
            setView={setView}
          />
        ) : view === 'home' ? (
          <HomeModule 
            type={type}
            setType={setType}
            amount={amount}
            setAmount={setAmount}
            category={category}
            setCategory={setCategory}
            itemName={itemName}
            setItemName={setItemName}
            transactionDate={transactionDate}
            setTransactionDate={setTransactionDate}
            isReimbursed={isReimbursed}
            setIsReimbursed={setIsReimbursed}
            accountMethod={accountMethod}
            setAccountMethod={setAccountMethod}
            reimburser={reimburser}
            setReimburser={setReimburser}
            employees={employees}
            activeEmployees={activeEmployees}
            reimbursementMethod={reimbursementMethod}
            setReimbursementMethod={setReimbursementMethod}
            remark={remark}
            setRemark={setRemark}
            fileInputRef={fileInputRef}
            setFile={setFile}
            handleSubmit={handleSubmit}
            resetForm={resetForm}
            isLoading={isLoading}
            balance={balance}
            allRecords={allRecords}
            handleDelete={handleDelete}
            handleStartInlineEdit={handleStartInlineEdit}
            setSelectedCategories={setSelectedCategories}
            setSelectedTypeFilter={setSelectedTypeFilter}
            setSelectedStatusFilter={setSelectedStatusFilter}
            setSearchText={setSearchText}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            setCurrentPage={setCurrentPage}
            setSelectedIds={setSelectedIds}
            setView={setView}
          />
        ) : (
          <AllRecordsModule 
            allRecords={allRecords}
            filteredRecords={filteredRecords}
            currentRecords={currentRecords}
            selectedTypeFilter={selectedTypeFilter}
            setSelectedTypeFilter={setSelectedTypeFilter}
            selectedStatusFilter={selectedStatusFilter}
            setSelectedStatusFilter={setSelectedStatusFilter}
            currentCategoryFilterOptions={currentCategoryFilterOptions}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            searchText={searchText}
            setSearchText={setSearchText}
            filteredTotalIncome={filteredTotalIncome}
            filteredTotalExpense={filteredTotalExpense}
            filteredNetBalance={filteredNetBalance}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            handleSelectOne={handleSelectOne}
            handleSelectAll={handleSelectAll}
            selectedTotalIncome={selectedTotalIncome}
            selectedTotalExpense={selectedTotalExpense}
            selectedNetBalance={selectedNetBalance}
            isBatchEditing={isBatchEditing}
            setIsBatchEditing={setIsBatchEditing}
            batchForm={batchForm}
            setBatchForm={setBatchForm}
            handleBatchUpdateSubmit={handleBatchUpdateSubmit}
            handleBatchDelete={handleBatchDelete}
            inlineEditingId={inlineEditingId}
            setInlineEditingId={setInlineEditingId}
            inlineForm={inlineForm}
            setInlineForm={setInlineForm}
            handleStartInlineEdit={handleStartInlineEdit}
            handleSaveInlineEdit={handleSaveInlineEdit}
            handleHistoryFileUpload={handleHistoryFileUpload}
            historyFileInputRef={historyFileInputRef}
            setUploadingRecordId={setUploadingRecordId}
            handleDelete={handleDelete}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
            employees={employees}
            activeEmployees={activeEmployees}
            isLoading={isLoading}
            setView={setView}
          />
        )}
      </div>
    </div>
  )
}

export default App
