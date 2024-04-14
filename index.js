
const appid='wx4120847faa3001be';
const secret='411af8a4ff0674b206f7e1ad8984efc8';
const userid='o-eSw6aHI7RpJByGzCBRgBaTa4cg';
const wechat_token_url='https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx4120847faa3001be&secret=411af8a4ff0674b206f7e1ad8984efc8'
const templateId='7EltqJnsht6YHNZabDfbATKdNq_AsiJM8NMo-D5Wj0E'

addEventListener('fetch'， event => {
  return event.respondWith(postWeChatUrl(event.request))
})

async function postWeChatUrl(request) {
  const { searchParams } = new URL(request.url);
  let title = searchParams.get('title');
  let content = searchParams.get('content');

  if(content==null){
    //参数没有内容的话不往下走了
    return new Response("空消息")
  }

  //这里是不使用存储的情况，每次都重新拿access_token
  // const tokenRes=await fetch(wechat_token_url);
  // const key=await tokenRes.json()
  // var wechat_work_url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=" + key.access_token



  //这里用到了cloudflare 的kv存储access_token,可以去掉，用上面那部分代码
  //这里没考虑access_token被其他情况刷新后不能使用情况，有空了改
  if(await MY_KV_NAMESPACE.get("token") == null){
    const tokenRes=await fetch(wechat_token_url);
    const key=await tokenRes.json()
    await MY_KV_NAMESPACE.put("token", key.access_token, {expirationTtl: 6000})
  }
  const access_token=await MY_KV_NAMESPACE.get("token")

  //拼接请求
  var wechat_work_url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=" + access_token

  // 重新构造 JSON
  var template = 
  {
		
    "touser":userid,
    "template_id":templateId,
    // "url":"http://weixin.qq.com/download",
	  "data":{
  		"title": {
  			"value":title
  		},
  		"content": {
  			"value":content
  		}
	  }		
  }


  const init = {
    body: JSON.stringify(template),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  // 发出请求
  const response = await fetch(wechat_work_url, init)

  // 准备结果
  const results = await gatherResponse(response)
  return new Response(results, init)

}

async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return JSON.stringify(await response.json())
  } else {
    return await response.text()
  }
}
