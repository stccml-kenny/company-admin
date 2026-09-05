import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

function App() {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [allRecords, setAllRecords] = useState([])
  const [balance, setBalance] = useState(0)
  const [view, setView] = useState('home')
  const [editingId, setEditingId] = useState(null)
  
  const fileInputRef = useRef(null)

  const fetchRecords = async () => {
    // 依交易日期由新到舊排序，若日期相同則依 ID 由新到舊排序
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
    setType(record.type)
    setAmount(record.amount)
    setCategory(record.category)
    const cleanDate = record.transaction_date ? record.transaction_date.toString().split('T')[0] : new Date().toISOString().split('T')[0]
    setTransactionDate(cleanDate)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setAmount('')
    setCategory('')
    setTransactionDate(new Date().toISOString().split('T')[0])
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!amount || !category) {
      alert('請輸入金額和類別！')
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
            transaction_date: transactionDate,
            receipt_url: receiptUrl 
          }])

        if (error) throw error
        alert('✅ 記錄新增成功！')
      }

      setEditingId(null)
      setAmount('')
      setCategory('')
      setTransactionDate(new Date().toISOString().split('T')[0])
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

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
                <label className="block text-sm font-medium text-gray-700 mb-1">類別 / 商戶名稱</label>
                <input 
                  type="text" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none"
                  placeholder="例如：牛牛小廚、紅茶、餐飲"
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
                    onClick={() => setView('all')}
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
                          <p className="font-medium text-gray-800">{record.category}</p>
                          <p className="text-xs text-gray-500">{record.transaction_date}</p>
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
                  onClick={() => setView('all')}
                  className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  查看全部 {allRecords.length} 筆歷史記錄
                </button>
              )}
            </div>
          </>
        ) : (
          // ================= 全部記錄頁面 =================
          <>
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setView('home')}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                ← 返回主頁
              </button>
              <h1 className="text-xl font-bold text-gray-800">全部歷史記錄</h1>
              <div className="w-16"></div>
            </div>

            <div className="space-y-3">
              {allRecords.length === 0 ? (
                <p className="text-gray-500 text-center text-sm">目前尚無記錄</p>
              ) : (
                allRecords.map((record) => (
                  <div key={record.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{record.category}</p>
                        <p className="text-xs text-gray-500">{record.transaction_date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`font-bold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {record.type === 'income' ? '+' : '-'}${record.amount}
                        </div>
                        <button 
                          onClick={() => { setView('home'); handleEditClick(record); }}
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

            <button 
              onClick={() => setView('home')}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold text-center shadow hover:bg-blue-700 transition-colors"
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