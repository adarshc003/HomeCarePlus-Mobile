import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface QueuedToast {
  type: ToastType;
  text1: string;
  text2?: string;
}

// Toast.show() has no built-in queue (the library's own source has a
// `// TODO: use a queue when Toast is already visible` comment right where
// it overwrites the current toast) — a second call while one is already
// displayed simply replaces it, so a rapid-fire second toast silently
// erased the first before it could be read. Queueing here (outside the
// library) means every call is eventually shown, one at a time, in order.
let isToastVisible = false;
const queue: QueuedToast[] = [];

const displayNext = (toast: QueuedToast) => {
  isToastVisible = true;

  Toast.show({
    type: toast.type,
    text1: toast.text1,
    text2: toast.text2,
    position: 'top',
    onHide: () => {
      isToastVisible = false;

      const next = queue.shift();

      if (next) {
        displayNext(next);
      }
    },
  });
};

const enqueue = (toast: QueuedToast) => {
  if (isToastVisible) {
    queue.push(toast);
    return;
  }

  displayNext(toast);
};

export const showSuccess = (
  text1: string,
  text2?: string,
) => {
  enqueue({type: 'success', text1, text2});
};

export const showError = (
  text1: string,
  text2?: string,
) => {
  enqueue({type: 'error', text1, text2});
};

export const showInfo = (
  text1: string,
  text2?: string,
) => {
  enqueue({type: 'info', text1, text2});
};

export const showWarning = (
  text1: string,
  text2?: string,
) => {
  enqueue({type: 'warning', text1, text2});
};
