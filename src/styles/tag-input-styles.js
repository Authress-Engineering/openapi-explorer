import { css } from 'lit';
export default css`
tag-input .tags{
  display:flex;
  flex-wrap: wrap;
  outline: none;
  padding:0;
  border-radius:var(--border-radius);
  border:1px solid var(--border-color);
  cursor:text;
  overflow:hidden;
  background:var(--input-bg);
}
tag-input .tag, .editor {
  padding:3px;
  margin:2px;
}
tag-input .tag {
  align-self: center;
  border:1px solid var(--border-color);
  background-color:var(--bg3);
  color:var(--fg3);
  border-radius:var(--border-radius);
  word-break: break-all;
  font-size: var(--font-size-small);
}
tag-input .tag:hover ~ #cursor {
  display: block;
}
tag-input .editor {
  flex:1;
  border:1px solid transparent;
  color:var(--fg);
  min-width:60px;
  outline: none;
  line-height: inherit;
  font-family:inherit;
  background:transparent;
  font-size: calc(var(--font-size-small) + 1px);
}
tag-input .editor::placeholder {
  color: var(--placeholder-color);
  opacity:1;
}`;
