import { css } from 'lit-element';

export default css`
  ::selection {
    background: var(--selection-bg);
    color: var(--selection-fg);
  }
  .regular-font{ 
    font-family:var(--font-regular); 
  }
  .mono-font { 
    font-family:var(--font-mono); 
  }
  .title { 
    font-size: calc(var(--font-size-small) + 18px);
    font-weight: normal 
  }
  .sub-title{ font-size: 20px;}
  .req-res-title {
    font-family: var(--font-regular);
    font-size: calc(var(--font-size-small) + 4px);
    font-weight:bold;
    margin-bottom:8px;
  }
  .tiny-title { 
    font-size:calc(var(--font-size-small) + 1px); 
    font-weight:bold; 
  }
  .regular-font-size { font-size: var(--font-size-regular); }
  .small-font-size { font-size: var(--font-size-small); }
  .upper { text-transform: uppercase; }
  .primary-text{ color: var(--primary-color); }
  .bold-text { font-weight:bold; }
  .gray-text { color: var(--light-fg); }
  .red-text {color: var(--red)}
  .blue-text {color: var(--blue)}
  .multiline {
    overflow: scroll;
    max-height: var(--resp-area-height, 300px);
    color: var(--fg3);  
  }
  .method-fg.put { color: var(--orange); }
  .method-fg.post { color: var(--green); }
  .method-fg.get { color: var(--blue); }
  .method-fg.delete { color: var(--red); }
  .method-fg.patch { color: var(--yellow); }

  h1{ font-family:var(--font-regular); font-size:28px; padding-top: 10px; letter-spacing:normal; font-weight:normal; }
  h2{ font-family:var(--font-regular); font-size:24px; padding-top: 10px; letter-spacing:normal; font-weight:normal; }
  h3{ font-family:var(--font-regular); font-size:18px; padding-top: 10px; letter-spacing:normal; font-weight:normal; }
  h4{ font-family:var(--font-regular); font-size:16px; padding-top: 10px; letter-spacing:normal; font-weight:normal; }
  h5{ font-family:var(--font-regular); font-size:14px; padding-top: 10px; letter-spacing:normal; font-weight:normal; }
  h6{ font-family:var(--font-regular); font-size:14px; padding-top: 10px; letter-spacing:normal; font-weight:normal; }

  h1,h2,h3,h4,h5,h5{
    margin-block-end: 0.2em;
  }
  p { margin-block-start: 0.5em; }

  code,
  pre {
    margin: 0px;
    font-family: var(--font-mono);
    font-size: calc(var(--font-size-mono) - 1px);
  }

  .m-markdown,
  .m-markdown-small{
    display:block;
  }

  .m-markdown p,
  .m-markdown span {
    line-height:calc(var(--font-size-regular) + 8px);
    font-size: var(--font-size-regular);
  }
  .m-markdown code span{
    font-size:var(--font-size-mono);
  }
  
  .m-markdown li{
    line-height:calc(var(--font-size-regular) + 8px);
    font-size:calc(var(--font-size-regular) - 1px);
  }

  .m-markdown-small p,
  .m-markdown-small span,
  .m-markdown-small li{
    color: var(--light-fg);
    font-size: var(--font-size-small);
    line-height: calc(var(--font-size-small) + 6px);
    margin-top: 0;
  }
  
  .m-markdown-small p:not(:first-child),
  .m-markdown p:not(:first-child) {
    margin-block-start: 24px;
  }

  .m-markdown p,
  .m-markdown-small p{
    margin-block-end: 0
  }

  .m-markdown-small ul,
  .m-markdown-small ol{
    padding-inline-start: 20px;
  }
  .m-markdown-small code,
  .m-markdown code {
    padding: 1px 6px;
    border-radius: 2px;
    color: var(--red);
    background-color: var(--bg3);
    font-size: calc(var(--font-size-mono));
    line-height: 1.2;
  }

  .m-markdown-small code {
    font-size: calc(var(--font-size-mono) - 2px);
  }

  .m-markdown-small pre,
  .m-markdown pre {
    white-space: pre-wrap;
    overflow-x: auto;
    line-height: normal;
    border-radius: 2px;
    border: 1px solid var(--code-border-color);
  }

  .m-markdown pre {
    margin-top: 8px;
    padding: 12px;
    background-color: var(--code-bg);
    color:var(--code-fg);
  }

  .m-markdown-small pre {
    margin-top: 4px;
    padding: 2px 4px;
    background-color: var(--bg3);
    color: var(--fg3);
  }

  .m-markdown-small pre code,
  .m-markdown pre code {
    border:none;
    padding:0;
  }

  .m-markdown pre code {
    color: var(--code-fg);
    background-color: var(--code-bg);
  }

  .m-markdown-small pre code {
    color:var(--fg2);
    background-color: var(--bg3);
  }


  .m-markdown ul,
  .m-markdown ol {
    padding-inline-start:30px;
  }
  .m-markdown-small a,
  .m-markdown a{
    color:var(--blue);
  }
  .m-markdown img{ max-width:100%; }

  /* Markdown table */

  .m-markdown-small table,
  .m-markdown table {
    border-spacing: 0;
    margin: 10px 0;
    border-collapse: separate;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: calc(var(--font-size-small) + 1px);
    line-height: calc(var(--font-size-small) + 4px);
    max-width: 100%;
  }

  .m-markdown-small table {
    font-size: var(--font-size-small);
    line-height: calc(var(--font-size-small) + 2px);
    margin: 8px 0;
  }

  .m-markdown-small tr:first-child th,
  .m-markdown tr:first-child th {
    border-top: 0 none;
  }

  .m-markdown-small td, 
  .m-markdown-small th, 
  .m-markdown td, 
  .m-markdown th {
    padding: 8px;
    vertical-align: top;
    border-top: 1px solid var(--border-color);
  }

  .m-markdown-small td,
  .m-markdown-small th {
    line-height: calc(var(--font-size-small) + 4px);
  }

  .m-markdown th {
    color: var(--fg3);
    font-weight: 600;
    padding: 10px 8px;
    letter-spacing: normal;
    background-color: var(--bg2);
    vertical-align: middle;
  }

  .m-markdown table code {
    font-size:calc(var(--font-size-small) - 1px);
  }
  .m-markdown blockquote,
  .m-markdown-small blockquote {
    margin-inline-start: 0;
    margin-inline-end: 0;
    border-left: 3px solid var(--border-color);
    padding: 6px 0 6px 6px;
  }
`;
