export function toast(text: string, variant: 'primary' | 'success' | 'neutral' | 'warning' | 'danger' = "primary", icon = "info") {
    const alert = Object.assign(document.createElement('sl-alert'), {
        variant,
        closable: true,
        duration: 3000,
        innerHTML: `
          <sl-icon name="${icon}" slot="icon"></sl-icon>
          ${escapeHtml(text)}
        `
      });
  
      document.body.append(alert);
      return alert.toast();
}

// Always escape HTML for text arguments!
function escapeHtml(html: string) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}