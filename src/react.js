/**
 * reactEventListener - takes the hard work out of adding and removing listeners in React
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener}
 *
 * @param {object} React - The React object that contains the method { useEffect }.
 * @param {string} eventName - A case-sensitive string or strings representing the event type to listen for
 * @param {function} callbackFunction - callback function - The object that receives a notification (an object that implements the Event interface) when an event of the specified type occurs
 */
export function reactEventListener({ useEffect }, eventName, functionCallback) {
  const targetElement = window;

  useEffect(() => {
    targetElement.addEventListener(eventName, functionCallback);
    // This is an effect that requires cleanup when the component using this
    // custom hook unmounts:
    // https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
    return () => {
      // Check if the event functionCallback we were given was a debounced or throttled
      // event functionCallback, if it is, cancel any future events
      // https://github.com/niksy/throttle-debounce#cancelling
      if (functionCallback?.cancel) {
        functionCallback.cancel();
      }

      // Remove the event functionCallbacks
      if (targetElement?.removeEventListener) {
        targetElement.removeEventListener(eventName, functionCallback);
      }
    };
  }, [eventName, functionCallback, targetElement]);
}
