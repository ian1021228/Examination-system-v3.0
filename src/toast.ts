export function toast(msg: string) {
  const div = document.createElement('div');
  div.textContent = msg;
  div.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg whitespace-pre-wrap z-50';
  document.body.appendChild(div);
  setTimeout(() => {
    div.remove();
  }, 3000);
}
