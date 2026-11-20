import { html } from 'lit';

/* Renders conditional (if/then/else) constraints as indented blocks below the regular constraints */
export function renderConditions(conditions) {
  if (!Array.isArray(conditions) || !conditions.length) {
    return '';
  }
  return html`${conditions.map((condition) => html`
    <div class='conditional-constraint' style='overflow-wrap:anywhere; margin:2px 8px 2px 0; padding-left:8px; border-left:2px solid var(--border-color, #ccc);'>
      ${condition.when}: ${condition.rules.map((rule, i) => html`${i > 0 ? ', ' : ''}<span class='bold-text'>${rule.label}${rule.value !== '' ? ': ' : ''}</span>${rule.value}`)}
    </div>`)}`;
}
