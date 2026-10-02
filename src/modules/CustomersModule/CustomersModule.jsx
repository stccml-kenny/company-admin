import React from 'react'

export default function CustomersModule({
  customers,
  documents,
  editingCustId,
  setEditingCustId,
  newCustName,
  setNewCustName,
  newCustContact,
  setNewCustContact,
  newCustEmail,
  setNewCustEmail,
  newCustPhone,
  setNewCustPhone,
  newCustAddress,
  setNewCustAddress,
  newCustStatus,
  setNewCustStatus,
  handleSaveCustomer,
  handleStartEditCustomer,
  handleDeleteCustomer,
  setView
}) {
  return (
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
                      <button onClick={() => handleStartEditCustomer(c)} className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-semibold">編輯 ✏️️</button>
                      <button onClick={() => handleDeleteCustomer(c.id)} className="bg-red-50 text-red-600 px-2 py-1 rounded font-semibold">刪除 🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
  )
}
