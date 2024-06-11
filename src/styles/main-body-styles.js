import { css } from 'lit';

export default css`
      *:not(:defined) { display:none }

      :host {
        display:flex;
        flex-direction: column;
        width:100%;
        height:100%;
        margin:0;
        padding:0;
        overflow: hidden;
        letter-spacing:normal;
        color:var(--fg);
        background-color:var(--bg);
        font-family: var(--font-regular);
      }
      .body {
        display:flex;
        height:100%;
        width:100%;
        overflow:hidden;
      }

      a {
        text-decoration: none;
      }

      .main-content { 
        margin:0;
        padding: 0; 
        display:block;
        flex:1;
        height:100%;
        overflow-y: overlay;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: var(--border-color) transparent;
      }

      .main-content::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .main-content::-webkit-scrollbar-track {
        background:transparent;
      }
      .main-content::-webkit-scrollbar-thumb {
        background-color: var(--border-color);
      }

      .section-gap.section-tag {
        border-bottom:1px solid var(--border-color);
      }
      .method-section-gap {
        margin: 0;
        padding: 0 8px 0 4px;
        border-bottom: 1px solid var(--border-color);
      }
      .section-gap { 
        padding: 24px 0px 0px;
      }
      .section-tag-header {
        position:relative;
        cursor: n-resize;
        padding: 12px 0;
      }
      .collapsed .section-tag-header:hover{
        cursor: s-resize;
      }

      .section-tag-header:hover{
        background-image: linear-gradient(to right, rgba(0,0,0,0), var(--border-color), rgba(0,0,0,0));
      }

      .collapsed .section-tag-header:hover::after {
        color:var(--primary-color);
      }

      .collapsed .section-tag-body {
        display:none;
      }

      .logo {
        height:36px;
        width:36px;
        margin-left:5px; 
      }
      .only-large-screen-flex,
      .only-large-screen{
        display:none;
      }
      .header-title{
        font-size:calc(var(--font-size-regular) + 8px); 
        padding:0 8px;
      }
      .tag.title {
        margin-bottom: 1rem;
        font-weight: bold;
      }
      .header{
        background-color:var(--header-bg);
        color:var(--header-fg);
        width:100%;
      }

      input.header-input{
        background:var(--header-color-darker);
        color:var(--header-fg);
        border:1px solid var(--header-color-border);
        flex:1; 
        padding-right:24px;
        border-radius:3px;
      }
      input.header-input::placeholder {
        opacity:0.4;
      }
      input:disabled {
        cursor: not-allowed;
      }
      .loader {
        margin: 16px auto 16px auto; 
        border: 4px solid var(--bg3);
        border-radius: 50%;
        border-top: 4px solid var(--primary-color);
        width: 36px;
        height: 36px;
        animation: spin 2s linear infinite;
      }
      .expanded-endpoint-body, .expanded-endpoint-component {
        position: relative;
      }

      .divider { 
        border-top: 2px solid var(--border-color);
        margin: 24px 0;
        width:100%;
      }

      .security-tooltip {
        border: 1px solid var(--border-color);
        border-left-width: 4px;
        margin-left:2px;
      }
      .security-tooltip a {
        color: var(--fg2);
        text-decoration: none;
      }
      .tooltip-text {
        color: var(--fg2);
        background-color: var(--bg2);
        visibility: hidden;
        overflow-wrap: break-word;
      }
      .tooltip:hover {
        color: var(--primary-color);
        border-color: var(--primary-color);
      }
      .tooltip-replace:hover {
        visibility: hidden;
      }
      .tooltip:hover a:hover {
        color: var(--primary-color);
      }

      .tooltip:hover .tooltip-text {
        visibility: visible;
        cursor: text;
        opacity: 1;
      }

      @media only screen and (max-width: 767.98px) {
        .section-padding {
          // margin-right: 1rem;
          margin: 1rem;
        }

        .sub-title.tag {
          margin-left: 1rem;
        }
        .section-tag-body .description {
          margin-left: 1rem;
          margin-right: 1rem;
        }
      }

      @media only screen and (min-width: 768px) {
        .nav-bar {
          width: 260px;
          display:flex;
        }
        .only-large-screen{
          display:block;
        }
        .only-large-screen-flex{
          display:flex;
        }
        .section-gap {
          padding: 24px 24px; 
        }
        .section-gap--read-mode { 
          padding: 24px 8px; 
        }
        .section-gap--focused-mode {
          padding: 1.5rem;
        }
        .endpoint-body {
          position: relative;
          padding:36px 0 48px 0;
        }
      }

      @media only screen and (min-width: 1024px) {
        .nav-bar {
          width: 330px;
          display:flex;
        }
        .section-gap--read-mode { 
          padding: 24px 24px 12px;
        }
        .main-content-inner {
          padding: 24px;
        }
      }`;
