import { chatHistorySampleData } from '../constants/chatHistory'

import { ChatMessage, Conversation, ConversationRequest, CosmosDBHealth, CosmosDBStatus, UserInfo } from './models'

export async function conversationApi(options: ConversationRequest, abortSignal: AbortSignal): Promise<Response> {
  const response = await fetch('/conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: options.messages
    }),
    signal: abortSignal
  })

  return response
}

export async function getUserInfo(): Promise<UserInfo[]> {
  const response = await fetch('/.auth/me')
  if (!response.ok) {
    console.log('No identity provider found. Access to chat will be blocked.')
    return []
  }

  const payload = await response.json()
  return payload
}

// export const fetchChatHistoryInit = async (): Promise<Conversation[] | null> => {
export const fetchChatHistoryInit = (): Conversation[] | null => {
  // Make initial API call here

  return chatHistorySampleData
}

export const historyList = async (offset = 0): Promise<Conversation[] | null> => {
  const response = await fetch(`/history/list?offset=${offset}`, {
    method: 'GET'
  })
    .then(async res => {
      const payload = await res.json()
      if (!Array.isArray(payload)) {
        console.error('There was an issue fetching your data.')
        return null
      }
      const conversations: Conversation[] = await Promise.all(
        payload.map(async (conv: any) => {
          let convMessages: ChatMessage[] = []
          convMessages = await historyRead(conv.id)
            .then(res => {
              return res
            })
            .catch(err => {
              console.error('error fetching messages: ', err)
              return []
            })
          const conversation: Conversation = {
            id: conv.id,
            title: conv.title,
            date: conv.createdAt,
            messages: convMessages
          }
          return conversation
        })
      )
      return conversations
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      return null
    })

  return response
}

export const historyRead = async (convId: string): Promise<ChatMessage[]> => {
  const response = await fetch('/history/read', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: convId
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(async res => {
      if (!res) {
        return []
      }
      const payload = await res.json()
      const messages: ChatMessage[] = []
      if (payload?.messages) {
        payload.messages.forEach((msg: any) => {
          const message: ChatMessage = {
            id: msg.id,
            role: msg.role,
            date: msg.createdAt,
            content: msg.content,
            feedback: msg.feedback ?? undefined
          }
          messages.push(message)
        })
      }
      return messages
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      return []
    })
  return response
}

export const historyGenerate = async (
  options: ConversationRequest,
  abortSignal: AbortSignal,
  convId?: string
): Promise<Response> => {
  let body
  if (convId) {
    body = JSON.stringify({
      conversation_id: convId,
      messages: options.messages
    })
  } else {
    body = JSON.stringify({
      messages: options.messages
    })
  }
  const response = await fetch('/history/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body,
    signal: abortSignal
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      return new Response()
    })
  return response
}

export const historyUpdate = async (messages: ChatMessage[], convId: string): Promise<Response> => {
  const response = await fetch('/history/update', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: convId,
      messages: messages
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(async res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}

export const historyDelete = async (convId: string): Promise<Response> => {
  const response = await fetch('/history/delete', {
    method: 'DELETE',
    body: JSON.stringify({
      conversation_id: convId
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}

export const historyDeleteAll = async (): Promise<Response> => {
  const response = await fetch('/history/delete_all', {
    method: 'DELETE',
    body: JSON.stringify({}),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}

export const historyClear = async (convId: string): Promise<Response> => {
  const response = await fetch('/history/clear', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: convId
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}

export const historyRename = async (convId: string, title: string): Promise<Response> => {
  const response = await fetch('/history/rename', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: convId,
      title: title
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}

export const historyEnsure = async (): Promise<CosmosDBHealth> => {
  const response = await fetch('/history/ensure', {
    method: 'GET'
  })
    .then(async res => {
      const respJson = await res.json()
      let formattedResponse
      if (respJson.message) {
        formattedResponse = CosmosDBStatus.Working
      } else {
        if (res.status === 500) {
          formattedResponse = CosmosDBStatus.NotWorking
        } else if (res.status === 401) {
          formattedResponse = CosmosDBStatus.InvalidCredentials
        } else if (res.status === 422) {
          formattedResponse = respJson.error
        } else {
          formattedResponse = CosmosDBStatus.NotConfigured
        }
      }
      if (!res.ok) {
        return {
          cosmosDB: false,
          status: formattedResponse
        }
      } else {
        return {
          cosmosDB: true,
          status: formattedResponse
        }
      }
    })
    .catch(err => {
      console.error('There was an issue fetching your data.')
      return {
        cosmosDB: false,
        status: err
      }
    })
  return response
}

export const frontendSettings = async (): Promise<Response | null> => {
  const response = await fetch('/frontend_settings', {
    method: 'GET'
  })
    .then(res => {
      return res.json()
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      return null
    })

  return response
}
export const historyMessageFeedback = async (messageId: string, feedback: string): Promise<Response> => {
  const response = await fetch('/history/message_feedback', {
    method: 'POST',
    body: JSON.stringify({
      message_id: messageId,
      message_feedback: feedback
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue logging feedback.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}
