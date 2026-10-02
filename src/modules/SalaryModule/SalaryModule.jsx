import React from 'react'
import { accountMethodOptions } from '../../constants'

export default function SalaryModule({
  salaryEmployee,
  setSalaryEmployee,
  salaryAmount,
  setSalaryAmount,
  salaryMethod,
  setSalaryMethod,
  salaryDate,
  setSalaryDate,
  salaryRemark,
  setSalaryRemark,
  employees,
  activeEmployees,
  handlePaySalary,
  isLoading,
  setView
}) {
  return (
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
  )
}
