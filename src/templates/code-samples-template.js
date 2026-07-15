import { html } from 'lit';
import { getI18nText } from '../languages/index.js';

/* eslint-disable indent */
export default function codeSamplesTemplate(xCodeSamples) {
  return html`
  <section class="table-title top-gap">${getI18nText('parameters.samples')}</div>
  <div class="tab-panel col"
    @click="${
      (e) => {
        if (!e.target.classList.contains('tab-btn')) { return; }
        const clickedTab = e.target.dataset.tab;

        const tabButtons = [...e.currentTarget.querySelectorAll('.tab-btn')];
        const tabContents = [...e.currentTarget.querySelectorAll('.tab-content')];
        tabButtons.forEach((tabBtnEl) => tabBtnEl.classList[tabBtnEl.dataset.tab === clickedTab ? 'add' : 'remove']('active'));
        tabContents.forEach((tabBodyEl) => { tabBodyEl.style.display = (tabBodyEl.dataset.tab === clickedTab ? 'block' : 'none'); });
      }
    }">
    <div class="tab-buttons row" role="group" style="width:100; overflow">
      ${xCodeSamples.map((v, i) => html`<button class="tab-btn ${i === 0 ? 'active' : ''}" aria-current='${i === 0}' data-tab = '${v.lang}${i}'> ${v.label || v.lang} </button>`)}
    </div>
    ${xCodeSamples.map((v, i) => {
      // We skip the first line because it could be there is no padding there, but padding on the next lines which needs to be removed
      const paddingToRemove = Math.min(...v.source.split('\n').slice(1).map(l => l.match(/^(\s*).*$/m)?.[1].length).filter(l => typeof l !== 'undefined'));
      const sanitizedSource = v.source.split('\n').map(s => s.substring(0, paddingToRemove).match(/^\s+$/) ? s.substring(paddingToRemove) : s);
      const fullSource = sanitizedSource.join('\n');
      return html`
        <div class="tab-content m-markdown code-sample-wrapper" style= "display:${i === 0 ? 'block' : 'none'}" data-tab = '${v.lang}${i}'>
          <syntax-highlighter language="${v.lang}" .content="${fullSource}" .label="Code sample"/>
        </div>`;
    })
    }
  </section>`;
}
/* eslint-enable indent */
