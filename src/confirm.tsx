import { createRoot } from 'react-dom/client';

export function confirmModal(message: string): Promise<boolean> {
  return new Promise((resolve) => {
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
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
          <p className="text-[#4A3F35] font-bold text-lg mb-6 whitespace-pre-wrap">{message}</p>
          <div className="flex justify-center space-x-3">
            <button 
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg font-bold text-[#8C7A6B] hover:bg-[#F5F5F0] transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg font-bold bg-[#BC7665] text-white hover:bg-[#AC6655] transition-colors"
            >
              確定
            </button>
          </div>
        </div>
      </div>
    );
  });
}
