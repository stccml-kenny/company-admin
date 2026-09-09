import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TENANT_ID = "e0151206-dc12-492e-870e-f462036dfb05"
const CLIENT_ID = Deno.env.get('M365_CLIENT_ID')
const CLIENT_SECRET = Deno.env.get('M365_CLIENT_SECRET')
const SENDER_EMAIL = Deno.env.get('M365_SENDER_EMAIL')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')

async function getAccessToken() {
  const url = "https://login.microsoftonline.com/" + TENANT_ID + "/oauth2/v2.0/token"
  const params = new URLSearchParams()
  params.append('client_id', CLIENT_ID!)
  params.append('scope', 'https://graph.microsoft.com/.default')
  params.append('client_secret', CLIENT_SECRET!)
  params.append('grant_type', 'client_credentials')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  const data = await res.json()
  return data.access_token
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const type = payload.type || 'INSERT'
    const record = payload.record || payload

    const accessToken = await getAccessToken()
    if (!accessToken) {
      throw new Error("無法取得 Microsoft 365 存取權杖 (Access Token)")
    }

    const subject = type === 'INSERT' ? `[公司記賬] 新增交易: ${record.item_name || '無名稱'}` : `[公司記賬] 更新交易: ${record.item_name || '無名稱'}`
    const htmlContent = `
      <h2>交易明細通知</h2>
      <p><b>類型：</b> ${record.type === 'income' ? '收入 (入數)' : '支出 (出數)'}</p>
      <p><b>金額：</b> $${record.amount}</p>
      <p><b>類別：</b> ${record.category}</p>
      <p><b>名稱：</b> ${record.item_name || '無'}</p>
      <p><b>日期：</b> ${record.transaction_date}</p>
      <p><b>備註：</b> ${record.remark || '無'}</p>
    `

    const graphRes = await fetch("https://graph.microsoft.com/v1.0/users/" + SENDER_EMAIL + "/sendMail", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: subject,
          body: {
            contentType: 'HTML',
            content: htmlContent,
          },
          toRecipients: [
            {
              emailAddress: {
                address: ADMIN_EMAIL,
              },
            },
          ],
        },
        saveToSentItems: 'true',
      }),
    })

    if (!graphRes.ok) {
      const errText = await graphRes.text()
      throw new Error(`Graph API 發信失敗: ${errText}`)
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error("M365 發信錯誤:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
})