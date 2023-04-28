import { createParser } from 'eventsource-parser'
import type { ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import type { ChatMessage } from '@/types'

const model = import.meta.env.OPENAI_API_MODEL || 'gpt-3.5-turbo'

export const generatePayload = (apiKey: string, messages: ChatMessage[]): RequestInit & { dispatcher?: any } => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  method: 'POST',
  body: JSON.stringify({
    model,
    messages,
    temperature: 0.6,
    stream: false,
  }),
})

export const parseOpenAIStream = (rawResponse: Response) => {

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  if (!rawResponse.ok) {
    return new Response(rawResponse.body, {
      status: rawResponse.status,
      statusText: rawResponse.statusText,
    })
  }
  
  const stream = new ReadableStream({
    async start(controller) {
      
      for await (const chunk of rawResponse.body as any) {

        const templateString = decoder.decode(chunk);
        const json = JSON.parse(templateString);
        const answer = json.answer;
        console.log('answer:', answer);
        controller.enqueue(answer);
      }

      controller.close()
      return;
        
    },
  })

  return new Response(stream)
}
