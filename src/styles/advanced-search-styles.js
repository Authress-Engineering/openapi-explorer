import { css } from 'lit';

export default css`
  *, *:before, *:after { box-sizing: border-box; }

  .dialog-box-overlay {
    background-color: var(--overlay-bg);
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    z-index: var(--dialog-z-index);
  }
  
  .dialog-box {
    position: fixed;
    top: 100px;
    left: 50%;
    transform: translate(-50%, 0%);
    display: flex;
    flex-direction: column;
    width: 50vw;
    background-color: var(--bg2);
    color: var(--fg2);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
  }
  
  .dialog-box-header {
    position: sticky;
    top: 0;
    align-self: stretch;
    display: flex;
    align-items: center;
    padding: 0px 16px;
    min-height: 60px;
    max-height: 60px;
    border-bottom: 1px solid var(--light-border-color);
    overflow: hidden;
  }

  .dialog-box .m-btn {
    padding: 1px 6px;
  }

  .dialog-box-content {
    padding: 16px;
    display:block;
  }

  .dialog-box-title {
    flex-grow: 1;
    font-size: 20px;
  }

  .advanced-search-options {
  }

  .advanced-search-dialog-input {
    width:100%;
  }

  #advanced-search-dialog-input {
    width: 100%;
  }

  .advanced-search-locations {
    display:flex;
    flex-direction: column;
    margin:8px 0 24px;
  }

  .advanced-search-locations label {
    font-size: var(--font-size-small);
  }
  .advanced-search-results {
    max-height: 400px;
    overflow: auto;
  }
`;
