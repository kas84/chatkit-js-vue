import * as ChatKitModule from '@openai/chatkit-js';
import { defineComponent, h, onBeforeUnmount, shallowRef, watch } from 'vue';

const CHATKIT_TAG_NAME = 'openai-chatkit';

const ChatKitElementConstructor =
  typeof ChatKitModule?.ChatKitElement === 'function'
    ? ChatKitModule.ChatKitElement
    : typeof ChatKitModule?.ChatKit === 'function'
      ? ChatKitModule.ChatKit
      : typeof ChatKitModule?.default === 'function'
        ? ChatKitModule.default
        : null;

if (
  typeof window !== 'undefined' &&
  typeof window.customElements !== 'undefined' &&
  !window.customElements.get(CHATKIT_TAG_NAME) &&
  ChatKitElementConstructor
) {
  window.customElements.define(CHATKIT_TAG_NAME, ChatKitElementConstructor);
}

const EVENT_MAP = {
  'chatkit.error': 'onError',
  'chatkit.response.end': 'onResponseEnd',
  'chatkit.response.start': 'onResponseStart',
  'chatkit.log': 'onLog',
  'chatkit.thread.change': 'onThreadChange',
  'chatkit.thread.load.start': 'onThreadLoadStart',
  'chatkit.thread.load.end': 'onThreadLoadEnd',
  'chatkit.ready': 'onReady',
};

const EVENT_NAMES = Object.keys(EVENT_MAP);

export const ChatKit = defineComponent({
  name: 'ChatKit',
  props: {
    control: {
      type: Object,
      required: true,
    },
  },
  setup(props, { attrs, expose }) {
    const elementRef = shallowRef(null);
    const listeners = new Map();
    let cancelPendingDefinition = null;

    const cleanupPending = () => {
      if (cancelPendingDefinition) {
        cancelPendingDefinition();
        cancelPendingDefinition = null;
      }
    };

    const cleanupListeners = () => {
      const element = elementRef.value;
      if (!element) return;

      for (const [event, listener] of listeners) {
        element.removeEventListener(event, listener);
      }
      listeners.clear();
    };

    const applyOptions = (options) => {
      const element = elementRef.value;
      if (!element) return;

      cleanupPending();

      if (customElements.get(CHATKIT_TAG_NAME)) {
        element.setOptions(options);
        return;
      }

      let active = true;
      customElements.whenDefined(CHATKIT_TAG_NAME).then(() => {
        if (active && elementRef.value) {
          elementRef.value.setOptions(options);
        }
      });

      cancelPendingDefinition = () => {
        active = false;
      };
    };

    const register = (el) => {
      cleanupListeners();
      cleanupPending();

      elementRef.value = el;
      props.control.setInstance(el);

      if (!el) return;

      for (const eventName of EVENT_NAMES) {
        const listener = (event) => {
          const handlerKey = EVENT_MAP[eventName];
          const handler = props.control.handlers[handlerKey];
          if (typeof handler === 'function') {
            handler(/** @type {CustomEvent} */ (event).detail);
          }
        };
        listeners.set(eventName, listener);
        el.addEventListener(eventName, listener);
      }

      applyOptions(props.control.options);
    };

    watch(
      () => props.control.options,
      (options) => {
        applyOptions(options);
      },
      { deep: true },
    );

    onBeforeUnmount(() => {
      cleanupListeners();
      cleanupPending();
      props.control.setInstance(null);
      elementRef.value = null;
    });

    expose({
      get element() {
        return elementRef.value;
      },
    });

    return () =>
      h(CHATKIT_TAG_NAME, {
        ...attrs,
        ref: register,
      });
  },
});
