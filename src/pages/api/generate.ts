// #vercel-disable-blocks
import { ProxyAgent, fetch } from 'undici'
// #vercel-end
import { generatePayload, parseOpenAIStream } from '@/utils/openAI'
import { verifySignature } from '@/utils/auth'
import type { APIRoute } from 'astro'

const apiKey = import.meta.env.OPENAI_API_KEY
const httpsProxy = import.meta.env.HTTPS_PROXY
const baseUrl = ((import.meta.env.OPENAI_API_BASE_URL) || 'http://localhost:5000').trim().replace(/\/$/, '')
const sitePassword = import.meta.env.SITE_PASSWORD || ''
const passList = sitePassword.split(',') || []

export const post: APIRoute = async(context) => {
  console.log('~~~~~~');
  const body = await context.request.json()
  const { sign, time, messages, pass } = body
  if (!messages) {
    return new Response(JSON.stringify({
      error: {
        message: 'No input text.',
      },
    }), { status: 400 })
  }
  if (sitePassword && !(sitePassword === pass || passList.includes(pass))) {
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid password.',
      },
    }), { status: 401 })
  }
  if (import.meta.env.PROD && !await verifySignature({ t: time, m: messages?.[messages.length - 1]?.content || '' }, sign)) {
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid signature.',
      },
    }), { status: 401 })
  }
  const msg = messages?.[messages.length - 1]?.content || '';
  console.log('ask:', msg);
  // const initOptions = generatePayload(apiKey, messages)
  // #vercel-disable-blocks
  // if (httpsProxy)
  //   initOptions.dispatcher = new ProxyAgent(httpsProxy)
  // #vercel-end

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  // initOptions.body = 
  const initOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: msg }),
    // dispatcher: new ProxyAgent(httpsProxy)
  };
  const response = await fetch(`${baseUrl}/api/ask`, initOptions).catch((err: Error) => {
    console.error(err)
    return new Response(JSON.stringify({
      error: {
        code: err.name,
        message: err.message,
      },
    }), { status: 500 })
  }) as Response

  return parseOpenAIStream(response) as Response




  // const response = await fetch(`${baseUrl}/api/ask`, JSON.stringify(initOptions)).catch((err: Error) => {
  //   console.error(err)
  //   return new Response(JSON.stringify({
  //     error: {
  //       code: err.name,
  //       message: err.message,
  //     },
  //   }), { status: 500 })
  // }) as Response

  // return response
}
