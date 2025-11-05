import { reactive, shallowRef, watch, unref } from 'vue';

const CHATKIT_METHOD_NAMES = Object.freeze([
  'focusComposer',
  'setThreadId',
  'sendUserMessage',
  'setComposerValue',
  'fetchUpdates',
  'sendCustomAction',
]);

const EVENT_HANDLER_REGEX = /^on[A-Z]/;

function syncState(target, source) {
  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      Reflect.deleteProperty(target, key);
    }
  }
  Object.assign(target, source);
}

function splitOptions(options) {
  if (!options || typeof options !== 'object') {
    return { options: {}, handlers: {} };
  }

  const pureOptions = {};
  const handlers = {};

  for (const [key, value] of Object.entries(options)) {
    if (key === 'onClientTool') {
      pureOptions[key] = value;
      continue;
    }

    if (EVENT_HANDLER_REGEX.test(key)) {
      handlers[key] = value;
    } else {
      pureOptions[key] = value;
    }
  }

  return { options: pureOptions, handlers };
}

export function useChatKit(optionsInput) {
  const instanceRef = shallowRef(null);
  const optionsState = reactive({});
  const handlersState = reactive({});

  const methods = {};
  for (const key of CHATKIT_METHOD_NAMES) {
    methods[key] = (...args) => {
      const element = instanceRef.value;
      if (!element) {
        console.warn('ChatKit element is not mounted');
        return;
      }

      return element[key](...args);
    };
  }

  const setInstance = (instance) => {
    instanceRef.value = instance;
  };

  const control = {
    setInstance,
    options: optionsState,
    handlers: handlersState,
  };

  watch(
    () => unref(optionsInput),
    (rawOptions) => {
      const next = splitOptions(rawOptions);
      syncState(optionsState, next.options);
      syncState(handlersState, next.handlers);
    },
    { deep: true, immediate: true },
  );

  return {
    ...methods,
    control,
    ref: instanceRef,
  };
}
