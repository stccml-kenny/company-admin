import React from 'react'

export default function ItemOptionsModule({
  commonItemOptions,
  newItemOptionName,
  setNewItemOptionName,
  handleAddItemOption,
  editingItemOptionId,
  editingItemOptionName,
  setEditingItemOptionName,
  setEditingItemOptionId,
  handleUpdateItemOption,
  handleDeleteItemOption,
  setView
}) {
  return (
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
  )
}
