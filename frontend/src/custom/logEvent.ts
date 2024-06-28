declare global {
  interface Window {
    dataLayer: Array<Object>
  }
}

export function logEvent(eventName: string, extraParameters: Object) {
  if (window.dataLayer != null) {
    window.dataLayer.push({ event: eventName, ...extraParameters })
  } else {
    console.log('In production, the following event would be logged to Google Analytics:', {
      eventName,
      extraParameters
    })
  }
}
