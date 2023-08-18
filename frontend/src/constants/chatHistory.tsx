import { Conversation } from "../api/models";

export const chatHistorySampleData: Conversation[] = [
    {
      "id": "1",
      "title": "Customer Support Issue And Resolution and Customer Support",
      "messages": [
        {
          "id": "1",
          "role": "user",
          "content": "How can I reset my password?",
          "date": "2023-08-10T08:00:00Z"
        },
        {
          "id": "2",
          "role": "assistant",
          "content": "To reset your password, please visit the 'Forgot Password' page and follow the instructions.",
          "date": "2023-08-10T08:05:00Z"
        }
      ],
      "date": "2023-08-10T07:55:00Z"
    },
    {
      "id": "2",
      "title": "Order Inquiry",
      "messages": [
        {
          "id": "3",
          "role": "user",
          "content": "Can you provide an update on my order?",
          "date": "2023-07-09T15:30:00Z"
        },
        {
          "id": "4",
          "role": "assistant",
          "content": "Sure! Let me check the status of your order. Please provide me with your order number.",
          "date": "2023-07-09T15:32:00Z"
        },
        {
          "id": "5",
          "role": "user",
          "content": "My order number is 12345.",
          "date": "2023-07-09T15:35:00Z"
        },
        {
          "id": "6",
          "role": "assistant",
          "content": "Thank you. I'm looking up the details for order #12345. Please wait a moment.",
          "date": "2023-07-09T15:40:00Z"
        }
      ],
      "date": "2023-07-09T15:25:00Z"
    },
    {
      "id": "3",
      "title": "August Entry 1",
      "messages": [
        {
          "id": "7",
          "role": "user",
          "content": "I have a question about my subscription.",
          "date": "2022-08-20T12:30:00Z"
        },
        {
          "id": "8",
          "role": "assistant",
          "content": "Of course! Feel free to ask your question, and I'll be happy to help.",
          "date": "2022-08-20T12:35:00Z"
        }
      ],
      "date": "2022-08-20T12:25:00Z"
    },
    {
      "id": "4",
      "title": "August Entry 2",
      "messages": [
        {
          "id": "9",
          "role": "user",
          "content": "When will my order be delivered?",
          "date": "2023-08-15T09:45:00Z"
        },
        {
          "id": "10",
          "role": "assistant",
          "content": "I can check the delivery status for you. Please provide your order number.",
          "date": "2023-08-15T09:50:00Z"
        }
      ],
      "date": "2023-08-15T09:40:00Z"
    },
    {
      "id": "5",
      "title": "June Entry 1",
      "messages": [
        {
          "id": "11",
          "role": "user",
          "content": "Is the product available in different colors?",
          "date": "2023-06-05T16:20:00Z"
        },
        {
          "id": "12",
          "role": "assistant",
          "content": "Yes, the product is available in blue, red, and green.",
          "date": "2023-06-05T16:25:00Z"
        }
      ],
      "date": "2023-06-05T16:15:00Z"
    },
    // ... (additional entries)
  ];