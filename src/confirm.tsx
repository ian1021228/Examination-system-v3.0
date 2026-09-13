import { createRoot } from 'react-dom/client';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function confirmModal(options: string | ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const title = typeof options === 'object' ? options.title : undefined;
    const message = typeof options === 'object' ? options.message : options;
    const confirmText = typeof options === 'object' && options.confirmText ? options.confirmText : '確定';
    const cancelText = typeof options === 'object' && options.cancelText ? options.cancelText : '取消';

    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);

    function cleanup() {
      root.unmount();
      div.remove();
    }

    function handleConfirm() {
      resolve(true);
      cleanup();
    }

    function handleCancel() {
      resolve(false);
      cleanup();
    }

    root.render(
      <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-[#EAE6DF]">
          {title && (
            <h3 className="text-lg font-bold text-[#4A3F35] mb-2">{title}</h3>
          )}
          <p className="text-[#6A5F55] text-sm sm:text-base mb-6 whitespace-pre-wrap leading-relaxed">{message}</p>
          <div className="flex justify-center space-x-3">
            <button 
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl font-bold text-[#8C7A6B] bg-[#F5F5F0] hover:bg-[#EAE6DF] transition-colors text-sm"
            >
              {cancelText}
            </button>
            <button 
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl font-bold bg-[#BC7665] text-white hover:bg-[#AC6655] transition-colors text-sm shadow-sm"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  });
}
